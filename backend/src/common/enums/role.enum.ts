/**
 * Roles del sistema. Coinciden con el ENUM user_role de PostgreSQL.
 */
export enum Role {
  CLIENTE = 'cliente',
  PRACTIKER = 'practiker',
  ADMIN = 'admin',
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}
