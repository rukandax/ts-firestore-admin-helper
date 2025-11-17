/**
 * Custom Transaction Examples
 * Demonstrates advanced transaction features for financial and critical operations
 */
interface BaseDocument {
    createdAt?: number;
    updatedAt?: number;
}
declare function transferMoney(senderWalletId: string, receiverWalletId: string, amount: number): Promise<{
    success: boolean;
    amount: number;
    senderNewBalance: number;
    receiverNewBalance: number;
}>;
declare function reserveProduct(productId: string, quantity: number): Promise<{
    success: boolean;
    reservedQuantity: number;
    remainingStock: number;
}>;
declare function confirmPurchase(productId: string, quantity: number): Promise<{
    success: boolean;
    newStock: number;
}>;
interface Post extends BaseDocument {
    title: string;
    content: string;
    views: number;
    likes: number;
    shares: number;
}
declare function incrementViewCount(postId: string): Promise<{
    id: string;
    data: Post;
}>;
declare function likePost(postId: string): Promise<{
    id: string;
    data: Post;
}>;
declare function unlikePost(postId: string): Promise<{
    id: string;
    data: Post;
}>;
interface Order extends BaseDocument {
    orderId: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    amount: number;
    userId: string;
    processedAt?: number;
    processedBy?: string;
}
declare function processOrder(orderId: string, workerId: string): Promise<{
    id: string;
    data: Order;
} | null>;
declare function bookEventSeats(eventId: string, seatsRequested: number, userId: string): Promise<{
    success: boolean;
    bookedSeats: number;
    remainingSeats: number;
    userId: string;
}>;
interface Document extends BaseDocument {
    title: string;
    content: string;
    version: number;
    lastEditedBy: string;
    lastEditedAt: number;
}
declare function updateDocumentWithVersion(docId: string, newContent: string, expectedVersion: number, userId: string): Promise<{
    id: string;
    data: Document;
}>;
declare function awardPoints(userId: string, pointsToAdd: number, purchaseAmount: number): Promise<{
    success: boolean;
    newPoints: number;
    newTier: "bronze" | "silver" | "gold" | "platinum";
    tierUpgraded: boolean;
    pointsAdded: number;
}>;
declare function runExamples(): Promise<void>;
export { transferMoney, reserveProduct, confirmPurchase, incrementViewCount, likePost, unlikePost, processOrder, bookEventSeats, updateDocumentWithVersion, awardPoints, runExamples, };
//# sourceMappingURL=transactions.d.ts.map