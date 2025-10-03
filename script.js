class QRScanner {
    constructor() {
        this.ticketsData = {};
        this.scanner = null;
        this.useBackCamera = true; // Préférence pour caméra arrière
        this.stats = {
            scanned: 0,
            valid: 0,
            invalid: 0
        };
        this.history = [];
        
        this.init();
    }

    async init() {
        await this.loadTicketsData();
        this.setupEventListeners();
        this.updateStats();
        // Démarrer automatiquement le scanner avec la caméra arrière
        setTimeout(() => {
            this.startScanning();
        }, 500);
    }

    async loadTicketsData() {
        try {
            const response = await fetch('tickets.json');
            this.ticketsData = await response.json();
            console.log('Données tickets chargées:', this.ticketsData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showError('Impossible de charger la base de données des tickets');
        }
    }

    setupEventListeners() {
        document.getElementById('start-scan').addEventListener('click', () => this.startScanning());
        document.getElementById('stop-scan').addEventListener('click', () => this.stopScanning());
        document.getElementById('switch-camera').addEventListener('click', () => this.switchCamera());
        document.getElementById('verify-manual').addEventListener('click', () => this.verifyManualInput());
        
        // Validation en temps réel pour l'input manuel
        document.getElementById('manual-qr').addEventListener('input', (e) => {
            if (e.target.value.length > 0) {
                document.getElementById('verify-manual').style.display = 'inline-block';
            }
        });

        // Gérer l'orientation du téléphone pour optimiser l'affichage
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.scanner) {
                    // Redimensionner le scanner après changement d'orientation
                    this.scanner.clear();
                    setTimeout(() => this.startScanning(), 500);
                }
            }, 500);
        });
    }

    async startScanning() {
        try {
            // Configuration avancée pour forcer la caméra arrière
            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                // Configuration pour caméra arrière/avant
                videoConstraints: {
                    facingMode: this.useBackCamera ? "environment" : "user"
                }
            };

            // Ajouter un message de statut
            const cameraType = this.useBackCamera ? "arrière" : "avant";
            document.getElementById('qr-reader').innerHTML = `
                <div class="loading"></div>
                <p>Démarrage de la caméra ${cameraType}...</p>
            `;

            this.scanner = new Html5QrcodeScanner("qr-reader", config, false);
            this.scanner.render(
                (decodedText) => this.onScanSuccess(decodedText),
                (error) => this.onScanFailure(error)
            );

            document.getElementById('start-scan').style.display = 'none';
            document.getElementById('stop-scan').style.display = 'inline-block';
            document.getElementById('switch-camera').style.display = 'inline-block';
            
        } catch (error) {
            console.error('Erreur lors du démarrage du scanner:', error);
            this.showError('Impossible de démarrer la caméra');
            // Afficher le bouton de démarrage manuel en cas d'erreur
            document.getElementById('start-scan').style.display = 'inline-block';
        }
    }

    switchCamera() {
        this.useBackCamera = !this.useBackCamera;
        if (this.scanner) {
            this.scanner.clear();
            setTimeout(() => this.startScanning(), 300);
        }
    }

    stopScanning() {
        if (this.scanner) {
            this.scanner.clear();
            this.scanner = null;
        }
        
        document.getElementById('start-scan').style.display = 'inline-block';
        document.getElementById('stop-scan').style.display = 'none';
        document.getElementById('switch-camera').style.display = 'none';
        document.getElementById('qr-reader').innerHTML = '<p>Scanner arrêté. Cliquez sur "Démarrer le scan" pour recommencer.</p>';
    }

    onScanSuccess(decodedText) {
        console.log('QR Code scanné:', decodedText);
        this.verifyTicket(decodedText);
        this.stopScanning();
    }

    onScanFailure(error) {
        // Les erreurs de scan sont normales, on ne les affiche pas
    }

    verifyManualInput() {
        const manualInput = document.getElementById('manual-qr').value.trim();
        if (manualInput) {
            this.verifyTicket(manualInput);
            document.getElementById('manual-qr').value = '';
        }
    }

    verifyTicket(qrContent) {
        this.stats.scanned++;
        
        const result = this.checkTicketValidity(qrContent);
        
        if (result.isValid) {
            this.stats.valid++;
            this.showValidTicket(result.ticket, qrContent);
        } else {
            this.stats.invalid++;
            this.showInvalidTicket(result.error, qrContent);
        }
        
        this.addToHistory(result, qrContent);
        this.updateStats();
    }

    checkTicketValidity(qrContent) {
        try {
            // Vérifier d'abord si c'est un format TICKET_V1
            if (qrContent.startsWith('TICKET_V1:')) {
                const base64Data = qrContent.replace('TICKET_V1:', '');
                const decodedData = JSON.parse(atob(base64Data));
                
                if (decodedData.data && decodedData.data.ticket_id) {
                    const ticketId = decodedData.data.ticket_id;
                    
                    // Vérifier si le ticket existe dans notre base
                    if (this.ticketsData[ticketId]) {
                        const ticket = this.ticketsData[ticketId];
                        
                        // Vérifier que le contenu QR correspond
                        if (ticket.qr_content === qrContent) {
                            // Vérifier le statut du ticket
                            if (ticket.status === 'active') {
                                return {
                                    isValid: true,
                                    ticket: ticket,
                                    decodedData: decodedData.data
                                };
                            } else {
                                return {
                                    isValid: false,
                                    error: `Ticket ${ticket.status}`,
                                    ticketId: ticketId
                                };
                            }
                        } else {
                            return {
                                isValid: false,
                                error: 'Contenu QR invalide',
                                ticketId: ticketId
                            };
                        }
                    } else {
                        return {
                            isValid: false,
                            error: 'Ticket non trouvé dans la base de données',
                            ticketId: ticketId
                        };
                    }
                } else {
                    return {
                        isValid: false,
                        error: 'Format de ticket invalide - données manquantes'
                    };
                }
            } else {
                // Vérifier si c'est directement un ID de ticket
                if (this.ticketsData[qrContent]) {
                    const ticket = this.ticketsData[qrContent];
                    if (ticket.status === 'active') {
                        return {
                            isValid: true,
                            ticket: ticket
                        };
                    } else {
                        return {
                            isValid: false,
                            error: `Ticket ${ticket.status}`,
                            ticketId: qrContent
                        };
                    }
                } else {
                    return {
                        isValid: false,
                        error: 'Format QR non reconnu'
                    };
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification:', error);
            return {
                isValid: false,
                error: 'Erreur de décodage du QR code'
            };
        }
    }

    showValidTicket(ticket, qrContent) {
        const resultSection = document.getElementById('result-section');
        const resultContent = document.getElementById('result-content');
        
        resultSection.className = 'result-section ticket-valid';
        resultSection.style.display = 'block';
        
        const eventDate = ticket.event_date ? new Date(ticket.event_date).toLocaleDateString('fr-FR') : 'Non définie';
        const purchaseDate = new Date(ticket.buyer_info.achat_le).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        resultContent.innerHTML = `
            <h3>✅ TICKET VALIDE</h3>
            <div class="ticket-info">
                <h4>${ticket.event_name}</h4>
                <div class="ticket-detail">
                    <div class="detail-item">
                        <span class="detail-label">ID du ticket</span>
                        <span class="detail-value">${ticket.ticket_id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type</span>
                        <span class="detail-value">${ticket.ticket_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Nom de l'acheteur</span>
                        <span class="detail-value">${ticket.buyer_info.nom}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date d'achat</span>
                        <span class="detail-value">${purchaseDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date de l'événement</span>
                        <span class="detail-value">${eventDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Statut</span>
                        <span class="detail-value">${ticket.status.toUpperCase()}</span>
                    </div>
                </div>
                ${ticket.additional_data.prix ? `<p><strong>Prix:</strong> ${ticket.additional_data.prix}</p>` : ''}
            </div>
        `;
    }

    showInvalidTicket(error, qrContent) {
        const resultSection = document.getElementById('result-section');
        const resultContent = document.getElementById('result-content');
        
        resultSection.className = 'result-section ticket-invalid';
        resultSection.style.display = 'block';
        
        resultContent.innerHTML = `
            <h3>❌ TICKET INVALIDE</h3>
            <div class="ticket-info">
                <p><strong>Erreur:</strong> ${error}</p>
                <p><strong>Contenu scanné:</strong> ${qrContent.substring(0, 100)}${qrContent.length > 100 ? '...' : ''}</p>
            </div>
        `;
    }

    addToHistory(result, qrContent) {
        const timestamp = new Date().toLocaleString('fr-FR');
        const historyItem = {
            timestamp,
            qrContent: qrContent.substring(0, 50) + (qrContent.length > 50 ? '...' : ''),
            isValid: result.isValid,
            error: result.error,
            eventName: result.ticket ? result.ticket.event_name : null,
            ticketId: result.ticket ? result.ticket.ticket_id : (result.ticketId || null)
        };
        
        this.history.unshift(historyItem);
        
        // Garder seulement les 10 derniers scans
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        
        this.updateHistory();
    }

    updateHistory() {
        const historyContainer = document.getElementById('scan-history');
        
        if (this.history.length === 0) {
            historyContainer.innerHTML = '<p>Aucun scan effectué</p>';
            return;
        }
        
        historyContainer.innerHTML = this.history.map(item => `
            <div class="history-item ${item.isValid ? 'valid' : 'invalid'}">
                <div class="history-timestamp">${item.timestamp}</div>
                <div>
                    <span class="history-status ${item.isValid ? 'valid' : 'invalid'}">
                        ${item.isValid ? 'VALIDE' : 'INVALIDE'}
                    </span>
                    ${item.eventName ? `<strong>${item.eventName}</strong>` : ''}
                    ${item.ticketId ? `<br>ID: ${item.ticketId}` : ''}
                    ${item.error ? `<br>Erreur: ${item.error}` : ''}
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('scanned-count').textContent = this.stats.scanned;
        document.getElementById('valid-count').textContent = this.stats.valid;
        document.getElementById('invalid-count').textContent = this.stats.invalid;
    }

    showError(message) {
        const resultSection = document.getElementById('result-section');
        const resultContent = document.getElementById('result-content');
        
        resultSection.className = 'result-section ticket-invalid';
        resultSection.style.display = 'block';
        
        resultContent.innerHTML = `
            <h3>❌ ERREUR</h3>
            <div class="ticket-info">
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialiser le scanner quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    new QRScanner();
});

// Fonction pour démarrer le scanner en plein écran sur mobile
function enableFullscreen() {
    const scanner = document.getElementById('qr-reader');
    if (scanner.requestFullscreen) {
        scanner.requestFullscreen();
    } else if (scanner.webkitRequestFullscreen) {
        scanner.webkitRequestFullscreen();
    } else if (scanner.msRequestFullscreen) {
        scanner.msRequestFullscreen();
    }
}