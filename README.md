# Scanner QR Code - Vérification de Tickets

Ce projet permet de scanner des QR codes et de vérifier leur validité contre une base de données JSON.

## Fonctionnalités

- **Scanner QR code via caméra** : Utilise la caméra de l'appareil pour scanner les QR codes
- **Saisie manuelle** : Possibilité de coller directement le contenu du QR code
- **Vérification en temps réel** : Vérification instantanée contre la base de données
- **Historique des scans** : Historique des 10 derniers scans
- **Statistiques** : Compteurs des tickets scannés, valides et invalides
- **Interface responsive** : Fonctionne sur desktop et mobile

## Structure des fichiers

```
Scanner/
├── index.html          # Interface principale
├── style.css           # Styles CSS
├── script.js           # Logique JavaScript
├── tickets.json        # Base de données des tickets
├── server.js           # Serveur local Node.js (optionnel)
└── README.md          # Ce fichier
```

## Format des tickets

Les tickets sont stockés dans `tickets.json` avec la structure suivante :

```json
{
  "ticket_id": {
    "ticket_id": "uuid",
    "event_name": "Nom de l'événement",
    "buyer_info": {
      "nom": "Nom de l'acheteur",
      "email": "email@example.com",
      "achat_le": "2025-10-03T21:56:07.576800"
    },
    "event_date": null,
    "ticket_type": "Standard",
    "price": "",
    "additional_data": {
      "type_billet": "Standard",
      "prix": ""
    },
    "qr_content": "TICKET_V1:base64_encoded_data",
    "filename": "ticket_filename.png",
    "filepath": "path/to/ticket.png",
    "generated_at": "2025-10-03T21:56:07.837242",
    "status": "active"
  }
}
```

## Utilisation

### Option 1 : Serveur local avec Node.js

1. Assurez-vous d'avoir Node.js installé
2. Naviguez vers le dossier du projet
3. Lancez le serveur :
   ```
   node server.js
   ```
4. Ouvrez votre navigateur et allez à `http://localhost:3000`

### Option 2 : Serveur web simple

Placez tous les fichiers sur un serveur web et accédez à `index.html`.

### Option 3 : Ouverture directe (limitée)

Vous pouvez ouvrir `index.html` directement dans un navigateur, mais certaines fonctionnalités peuvent être limitées à cause des restrictions CORS.

## Formats de QR codes supportés

1. **Format TICKET_V1** : `TICKET_V1:base64_encoded_json`
2. **ID direct** : L'ID du ticket directement

## Fonctionnalités de vérification

- Vérification de l'existence du ticket dans la base
- Validation du format du QR code
- Vérification du statut du ticket (active/inactive)
- Validation de l'intégrité des données

## Statuts des tickets

- **active** : Ticket valide et utilisable
- **used** : Ticket déjà utilisé
- **cancelled** : Ticket annulé
- **expired** : Ticket expiré

## Sécurité

- Les QR codes contiennent des données encodées en base64
- Vérification de l'intégrité avec signature (dans les données décodées)
- Validation stricte du format des données

## Dépendances

- [html5-qrcode](https://github.com/mebjas/html5-qrcode) : Bibliothèque pour le scan QR code
- Navigateur moderne avec support caméra

## Support navigateurs

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Navigateurs mobiles modernes

## Permissions requises

- **Caméra** : Pour scanner les QR codes
- **Microphone** : Peut être demandé par certains navigateurs

## Dépannage

### La caméra ne fonctionne pas
- Vérifiez les permissions de caméra
- Utilisez HTTPS ou localhost
- Vérifiez que la caméra n'est pas utilisée par une autre application

### Les QR codes ne sont pas reconnus
- Assurez-vous que le QR code est net et bien éclairé
- Utilisez la saisie manuelle en cas de problème
- Vérifiez le format du contenu QR

### Erreurs de chargement
- Vérifiez que tous les fichiers sont présents
- Utilisez un serveur web plutôt qu'une ouverture directe
- Vérifiez la console du navigateur pour les erreurs