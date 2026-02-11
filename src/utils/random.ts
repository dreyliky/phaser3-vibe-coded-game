export function pickWeighted<T>(items: { item: T, weight: number }[]): T | null {
    const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const entry of items) {
        if (random < entry.weight) {
            return entry.item;
        }
        random -= entry.weight;
    }
    
    return items.length > 0 ? items[0].item : null;
}
