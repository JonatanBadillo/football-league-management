# **Football League Management**

![Project Logo](#) <!-- Placeholder for project logo -->

## **Table of Contents**

- [**Football League Management**](#football-league-management)
  - [**Table of Contents**](#table-of-contents)
  - [**Project Description**](#project-description)
  - [**Key Features**](#key-features)
  - [**Technologies Used**](#technologies-used)
  - [**Prerequisites**](#prerequisites)
  - [**Installation Guide**](#installation-guide)
  - [**Project Structure**](#project-structure)
  - [**Authentication and Roles**](#authentication-and-roles)
    - [**Available Roles**](#available-roles)
    - [**Security**](#security)
  - [**Data Models**](#data-models)
    - [**League**](#league)
    - [**Team**](#team)
    - [**Player**](#player)
    - [**Match**](#match)
  - [**Main Routes**](#main-routes)
    - [**General**](#general)
    - [**Administrator**](#administrator)
    - [**Captain**](#captain)
    - [**Referee**](#referee)
  - [**Screenshots**](#screenshots)
    - [**Login Page**](#login-page)
    - [**Admin Dashboard**](#admin-dashboard)
    - [**Team Management**](#team-management)
    - [**Match Management**](#match-management)
  - [**Contributions**](#contributions)
  - [**License**](#license)

---

## **Project Description**

**Football League Management** is a web application designed to manage football leagues. This system allows administrators, captains, and referees to collaborate efficiently in organizing and managing leagues, teams, players, and matches. The platform includes user authentication and custom roles to ensure an optimized and secure experience.

---

## **Key Features**

- **League Management**: Create, edit, and delete leagues.
- **Team Management**: Associate teams with leagues, assign captains, and maintain statistics.
- **Player Management**: Add, edit, and delete players with a team limit.
- **Match Management**: Schedule, edit, and delete matches.
- **Statistics**:
  - Top scorers.
  - Best defenses (teams with the fewest goals conceded).
  - Average goals per match.
- **Roles and Permissions**: Role-based security (admin, captain, referee).

---

## **Technologies Used**

- **Backend**:
  - Node.js
  - Express.js
  - Sequelize (ORM for databases)
  - SQLite
- **Frontend**:
  - Handlebars.js (templating engine)
  - Bootstrap (for design)
- **Authentication and Security**:
  - Passport.js
  - express-session
  - connect-session-sequelize
- **Others**:
  - Multer (for file uploads)
  - Moment.js (for date handling)
  - TypeScript
  - HTTPS with SSL certificates.

---

## **Prerequisites**

1. Node.js (version 16 or higher).
2. npm (included with Node.js).
3. SQLite for the database.
4. SSL Certificates (`key.pem`, `cert.pem`).

---

## **Installation Guide**

1. Clone the repository:
   ```bash
   git clone <REPOSITORY_URL>
   cd football-league-management/webapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile TypeScript code:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Access the application in your browser:
   ```
   https://localhost:3000
   ```

---

## **Project Structure**

```plaintext
football-league-management/
├── webapp/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── adminRoutes.ts
│   │   │   ├── captainRoutes.ts
│   │   │   └── refereeRoutes.ts
│   │   ├── model/
│   │   ├── views/
│   │   ├── config/
│   │   ├── public/
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts
│   │   └── server.ts
│   ├── uploads/
│   ├── package.json
│   └── tsconfig.json
```

---

## **Authentication and Roles**

### **Available Roles**
1. **Administrator (admin)**: Full access to leagues, teams, players, and matches.
2. **Captain (captain)**: Manages their team and assigned players.
3. **Referee (referee)**: Manages matches and records statistics.

### **Security**
- Uses `passport.js` for local authentication.
- Middleware `isAuthenticated` and `hasRole` to protect routes.
- Session management with `express-session` and SQLite storage.

---

## **Data Models**

### **League**
- **Fields**: `id`, `name`, `totalGoalsFor`, `matchesPlayed`.
- **Relationships**: Has teams, players, jornadas, and matches.

### **Team**
- **Fields**: `id`, `name`, `leagueId`, `captainId`, `logo`, `balance`, `goalsFor`, `goalsAgainst`, `points`.
- **Relationships**: Belongs to a league, has players and matches.

### **Player**
- **Fields**: `id`, `name`, `position`, `teamId`, `leagueId`, `goals`, `yellowCards`, `redCards`.
- **Relationships**: Belongs to a team and a league.

### **Match**
- **Fields**: `id`, `jornadaId`, `homeTeamId`, `awayTeamId`, `date`, `scoreHome`, `scoreAway`.
- **Relationships**: Belongs to a jornada, has teams.

---

## **Main Routes**

### **General**
- `/`: Main page with general statistics.
- `/login`: Log in.
- `/logout`: Log out.

### **Administrator**
- `/dashboard/admin/ligas`: Manage leagues.
- `/dashboard/admin/equipos`: Manage teams.
- `/dashboard/admin/jugadores`: Manage players.
- `/dashboard/admin/partidos`: Manage matches.

### **Captain**
- `/dashboard/captain/jugadores`: Manage team players.

### **Referee**
- `/dashboard/referee/partidos`: View and edit matches.

---

## **Screenshots**

### **Login Page**
![Login Page](#)

### **Admin Dashboard**
![Admin Dashboard](#)

### **Team Management**
![Team Management](#)

### **Match Management**
![Match Management](#)

---

## **Contributions**

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a branch for your feature or fix: `git checkout -b feature/new-feature`.
3. Commit your changes: `git commit -m 'Add new feature'`.
4. Push your changes: `git push origin feature/new-feature`.
5. Open a Pull Request.

---

## **License**

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Thank you for using Football League Management!**
