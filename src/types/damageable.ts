export interface Damageable {
    takeDamage(amount: number): void;
    getHealth(): number;
    getMaxHealth(): number;
}
