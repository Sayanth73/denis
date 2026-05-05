# PRD — POC "TraceKebab"

**Version** : 0.1 — Proof of Concept
**Objectif** : démo cliquable destinée à valider le concept avec un transformateur de viande kebab (matières premières → broches finies → livraison restaurants).
**Pas une v1 de production.** Pas d'authentification, pas de base de données réelle, pas de paiement. Juste un flow fonctionnel à montrer.

---

## 1. Contexte métier (à comprendre avant de coder)

L'utilisateur cible est un **petit transformateur de viande** suisse qui :

1. Achète des **matières premières** : viande de bœuf, viande d'agneau, viande de poulet, épices, marinades, sel.
2. **Produit** des broches de kebab finies en mélangeant ces matières premières selon des **recettes** (ex : "broche standard 25 kg = 60% bœuf + 30% agneau + 10% mélange épices A").
3. **Livre** ces broches à des restaurants kebab clients réguliers.
4. Doit pouvoir **prouver la traçabilité** en cas de contrôle sanitaire OSAV : pour n'importe quelle broche livrée, retrouver les lots de matières premières qui la composent ; et inversement, pour n'importe quel lot de matière première, retrouver tous les clients qui ont reçu un produit fini en contenant.

Le POC doit rendre **visible** ce flow complet en quelques clics.

---

## 2. Stack technique (imposée)

- **Framework** : Next.js 14+ (App Router)
- **Langage** : TypeScript strict
- **Styling** : Tailwind CSS
- **Composants UI** : shadcn/ui (Button, Card, Table, Dialog, Input, Select, Badge, Tabs)
- **Icons** : lucide-react
- **State global** : Zustand avec persistance via `persist` middleware sur `localStorage` (pour que les données survivent au refresh)
- **Pas de backend.** Pas d'API routes. Pas de Supabase. Toutes les données vivent côté client.
- **Langue de l'interface** : français exclusivement

---

## 3. Modèle de données (TypeScript)

```typescript
// Matière première reçue (lot entrant)
type RawMaterial = {
  id: string;                    // uuid
  type: "boeuf" | "agneau" | "poulet" | "epices" | "marinade" | "autre";
  nom: string;                   // ex: "Épaule de bœuf désossée"
  fournisseur: string;           // ex: "Boucherie Müller SA"
  numeroLotFournisseur: string;  // ex: "BM-2026-0471"
  quantiteRecue: number;         // en kg
  quantiteRestante: number;      // en kg, décrémente quand utilisée en production
  dateReception: string;         // ISO date
  dlc: string;                   // ISO date, date limite de consommation
  temperatureReception: number;  // en °C
  certificatSanitaire?: string;  // numéro de certificat (optionnel)
};

// Recette de fabrication
type Recipe = {
  id: string;
  nom: string;                   // ex: "Broche kebab standard 25kg"
  poidsTotal: number;            // en kg, ex: 25
  composition: {
    typeMatiere: RawMaterial["type"];
    pourcentage: number;         // doit sommer à 100 sur l'ensemble
  }[];
};

// Ordre de fabrication
type ProductionOrder = {
  id: string;
  date: string;                  // ISO date
  recipeId: string;
  nombreBroches: number;
  // matières premières consommées : pour chaque ingrédient, on choisit quel lot puiser
  matieresPremieresUtilisees: {
    rawMaterialId: string;
    quantiteUtilisee: number;    // en kg
  }[];
  brochesProduites: FinishedProduct[];
};

// Broche finie
type FinishedProduct = {
  id: string;                    // uuid, sera le numéro de lot interne
  numeroLotInterne: string;      // ex: "TK-2026-0815-001"
  productionOrderId: string;
  poids: number;                 // en kg
  dateProduction: string;
  dlc: string;                   // calculée auto: production + 5 jours par défaut
  statut: "en_stock" | "livree";
  livraisonId?: string;          // si livrée
};

// Client (restaurant)
type Customer = {
  id: string;
  nom: string;                   // ex: "Kebab du Centre Yverdon"
  adresse: string;
  telephone: string;
  email?: string;
};

// Livraison
type Delivery = {
  id: string;
  date: string;
  customerId: string;
  brochesLivrees: string[];      // IDs des FinishedProduct livrés
  statut: "preparee" | "livree";
  notes?: string;
};
```

---

## 4. Données mockées au démarrage

Au premier chargement (si `localStorage` vide), seed avec :

- **5 matières premières** réparties sur 3 fournisseurs, dates de réception sur les 7 derniers jours
- **3 recettes** : "Broche standard 25 kg", "Broche poulet 20 kg", "Broche premium agneau 15 kg"
- **8 clients** restaurants kebab fictifs (noms réalistes : "Kebab Royal Lausanne", "Snack Istanbul Yverdon", etc., adresses en Suisse romande)
- **2 ordres de fabrication** déjà passés, avec broches produites
- **1 livraison** déjà effectuée

Bouton "Réinitialiser les données démo" dans un menu paramètres pour reset le `localStorage`.

---

## 5. Écrans à implémenter

### 5.1 Layout général

Sidebar gauche fixe avec navigation :
- 🏠 Tableau de bord
- 📦 Matières premières
- 🏭 Production
- 🚚 Livraisons
- 👥 Clients
- 🔍 Traçabilité

Header avec titre de la page + bouton "Réinitialiser démo" en haut à droite (icône discrète).

### 5.2 Tableau de bord (`/`)

4 cards en haut :
- **Matières premières en stock** : nombre de lots actifs + alerte rouge si DLC < 3 jours
- **Broches en stock** : nombre prêtes à livrer + poids total
- **Production cette semaine** : nombre de broches produites
- **Livraisons cette semaine** : nombre + valeur estimée

En dessous, 2 colonnes :
- **Alertes** : matières premières DLC proche, stock bas, broches non livrées depuis > 3 jours
- **Activité récente** : 5 dernières actions (réceptions, productions, livraisons) en timeline

### 5.3 Matières premières (`/matieres-premieres`)

Tableau triable avec : Type | Nom | Fournisseur | N° lot fournisseur | Quantité restante / reçue | DLC (badge couleur selon proximité) | Statut

Bouton "+ Réceptionner un lot" → ouvre un Dialog avec formulaire :
- Type (select)
- Nom (input)
- Fournisseur (input avec auto-complete sur fournisseurs existants)
- N° de lot fournisseur (input)
- Quantité reçue en kg (input number)
- Date de réception (date picker, défaut aujourd'hui)
- DLC (date picker)
- Température de réception en °C (input number)
- Certificat sanitaire (input optionnel)

Validation : tous les champs requis sauf certificat. DLC > date réception.

### 5.4 Production (`/production`)

2 sous-onglets : **Recettes** et **Ordres de fabrication**.

**Onglet Recettes** : liste des 3 recettes avec leur composition. Lecture seule pour le POC (pas de création de recette dans la v1).

**Onglet Ordres de fabrication** :
- Tableau : Date | Recette | Nombre de broches | Poids total | Lots consommés (lien)
- Bouton "+ Nouvel ordre de fabrication" → wizard en 3 étapes :
  1. **Choisir la recette** + nombre de broches voulues
  2. **Sélectionner les lots de matières premières** : pour chaque ingrédient de la recette, le système calcule la quantité nécessaire totale, et propose les lots disponibles du bon type triés par DLC croissante (FIFO). L'utilisateur peut allouer la quantité sur un ou plusieurs lots. Affichage en temps réel de "manquant : X kg" si pas assez.
  3. **Récapitulatif** + bouton "Confirmer la production". À la confirmation :
     - Décrémente `quantiteRestante` des lots consommés
     - Crée N broches avec numéros de lot internes auto-générés
     - Crée l'ordre de fabrication
     - Toast de succès avec lien vers la traçabilité

### 5.5 Livraisons (`/livraisons`)

Tableau : Date | Client | Nombre de broches | Poids total | Statut

Bouton "+ Nouvelle livraison" → Dialog :
- Choisir un client (select avec recherche)
- Date de livraison
- Sélectionner les broches en stock (multi-select avec checkboxes, affiche n° lot interne, poids, DLC)
- Notes (textarea optionnelle)
- Bouton "Préparer la livraison" puis "Marquer comme livrée"

À la confirmation : update statut des broches, crée la Delivery, broches passent de `en_stock` à `livree`.

### 5.6 Clients (`/clients`)

Tableau simple des clients. Bouton "+ Nouveau client". CRUD basique.

Sur clic d'un client → détail avec **historique des livraisons** : toutes les livraisons reçues, chaque livraison expandable pour voir les broches reçues + remontée vers les matières premières (chaîne de traçabilité complète).

### 5.7 Traçabilité (`/tracabilite`) — **L'écran qui fait vendre**

C'est le killer feature de la démo. **Soigne particulièrement l'UX de cet écran.**

Une grosse search bar en haut : "Rechercher un numéro de lot (matière première ou broche finie)..."

Au-dessus de la search bar, 2 boutons d'exemple cliquables :
- "🔎 Voir un exemple : tracer un lot de matière première" → pré-remplit avec un n° de lot fournisseur du seed
- "🔎 Voir un exemple : tracer une broche livrée" → pré-remplit avec un n° de lot interne

#### Cas 1 : recherche d'un lot de matière première

Affichage en 3 sections empilées verticalement, avec connexions visuelles entre elles (lignes ou flèches) :

1. **🟦 Matière première** : carte avec toutes les infos du lot (fournisseur, certificat, dates, températures)
2. **🟨 Ordres de fabrication concernés** : liste des productions ayant utilisé ce lot, avec quantité utilisée
3. **🟥 Clients impactés** : liste de tous les restaurants ayant reçu une broche issue de ce lot, avec date de livraison et n° lot interne de chaque broche

Bouton **"📄 Exporter dossier traçabilité (PDF)"** en haut à droite. Pour le POC : génère juste un PDF basique avec `react-to-print` ou `jsPDF` listant les infos. Pas besoin que ce soit beau, juste que ça marche.

#### Cas 2 : recherche d'une broche finie

Affichage inverse, en 3 sections :

1. **🟥 Broche finie** : n° lot interne, date production, poids, DLC, client livré + date
2. **🟨 Ordre de fabrication** : recette utilisée
3. **🟦 Matières premières utilisées** : la liste des lots fournisseur ayant composé cette broche

Même bouton d'export PDF.

---

## 6. Détails UX importants

- **Codes couleur DLC** : badge vert si > 5 jours, orange si 2-5 jours, rouge si < 2 jours, gris si dépassée
- **Numéros de lot internes** : format `TK-AAAA-MMJJ-NNN` (ex: `TK-2026-0815-001`)
- **Toasts** sur chaque action de création/modification (utiliser `sonner` de shadcn)
- **Empty states** soignés sur chaque tableau ("Aucune matière première en stock — réceptionnez votre premier lot")
- **Confirmations** avant les actions importantes (création d'un ordre de fabrication, livraison)
- **Pas de pagination** dans le POC, max 20-30 entrées par tableau ça suffit
- **Responsive desktop uniquement** : pas besoin que ça marche sur mobile, c'est une démo qui sera montrée sur laptop

---

## 7. Style visuel

- **Esthétique** : sobre, professionnelle, type SaaS B2B moderne. Inspirations : Linear, Notion, Vercel dashboard.
- **Palette** : neutre par défaut (gris/blanc/noir shadcn) + accents bleu pour les CTAs principaux. Couleurs sémantiques pour les statuts (vert/orange/rouge sur DLC et alertes uniquement).
- **Densité** : tableaux denses (texte 14px, padding cellule modéré) car le métier est orienté data.
- **Pas de design "fun"** : pas d'emojis dans l'UI sauf pour les icônes de navigation listées plus haut. Le métier est sérieux (sanitaire, légal).

---

## 8. Ce qui n'est PAS dans le POC

À NE PAS implémenter, pour rester dans le scope :

- ❌ Authentification, comptes utilisateurs, rôles
- ❌ Génération de factures, QR-bill, comptabilité
- ❌ Gestion des prix, marges, devis
- ❌ Notifications par email ou SMS
- ❌ Multi-langue
- ❌ Mode sombre
- ❌ Mobile / responsive
- ❌ Création/édition de recettes (lecture seule sur les 3 mockées)
- ❌ Backend, base de données, API externe
- ❌ Tests unitaires (c'est un POC)

---

## 9. Critères de succès du POC

Le POC est réussi si, en moins de 5 minutes de démo, on peut :

1. Réceptionner un nouveau lot de viande de bœuf
2. Lancer un ordre de fabrication qui consomme ce lot et produit 4 broches
3. Livrer 2 de ces broches à un client kebab
4. Faire une recherche de traçabilité sur le n° de lot fournisseur initial et **voir** la chaîne complète : fournisseur → production → client final
5. Exporter le dossier traçabilité en PDF

Si ce flow tourne, le POC fait son job.

---

## 10. Livrable attendu de Claude Code

- Repo Next.js complet, fonctionnel avec `npm run dev`
- README avec instructions de lancement
- Code propre, composants découpés, pas de fichiers de plus de 300 lignes
- Données seed automatique au premier lancement
- Pas de TODO restants dans le code

---

**Fin du PRD.**
