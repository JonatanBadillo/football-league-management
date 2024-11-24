import User from "../../model/User"; // Ajusta esta ruta a donde esté tu modelo User

declare global {
  namespace Express {
    // Extiende la interfaz `User` de Express
    interface User {
      id: number;
      username: string;
      role: string;
      password: string;
    }
  }
}
