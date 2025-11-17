/**
 * Multiple OrderBy Examples
 * Demonstrates how to use multiple orderBy fields for complex sorting
 */
interface Product {
    name: string;
    category: string;
    price: number;
    rating: number;
    stock: number;
    featured: boolean;
    createdAt?: number;
    updatedAt?: number;
}
declare function getBestDeals(): Promise<{
    id: string;
    data: Product;
}[]>;
declare function getProductsByCategory(category: string): Promise<{
    id: string;
    data: Product;
}[]>;
declare function getNewArrivals(): Promise<{
    id: string;
    data: Product;
}[]>;
interface Post {
    authorId: string;
    authorName: string;
    content: string;
    likes: number;
    comments: number;
    isPinned: boolean;
    category: 'announcement' | 'discussion' | 'question' | 'showcase';
    createdAt?: number;
    updatedAt?: number;
}
declare function getFeedPosts(): Promise<{
    id: string;
    data: Post;
}[]>;
declare function getTrendingPosts(): Promise<{
    id: string;
    data: Post;
}[]>;
interface Employee {
    name: string;
    department: string;
    position: string;
    level: number;
    salary: number;
    hireDate: number;
    performance: number;
    createdAt?: number;
    updatedAt?: number;
}
declare function getEmployeesByDepartment(department: string): Promise<{
    id: string;
    data: Employee;
}[]>;
declare function getTopPerformers(): Promise<{
    id: string;
    data: Employee;
}[]>;
interface Event {
    title: string;
    type: 'conference' | 'workshop' | 'meetup' | 'webinar';
    startDate: number;
    endDate: number;
    capacity: number;
    registered: number;
    priority: number;
    featured: boolean;
    createdAt?: number;
    updatedAt?: number;
}
declare function getUpcomingEvents(): Promise<{
    id: string;
    data: Event;
}[]>;
declare function getEventsByAvailability(): Promise<{
    id: string;
    data: Event;
}[]>;
declare function useTypeSafeOptions(): Promise<{
    products: {
        id: string;
        data: Product;
    }[];
    employees: {
        id: string;
        data: Employee;
    }[];
}>;
export declare function runExamples(): Promise<void>;
export { getBestDeals, getProductsByCategory, getNewArrivals, getFeedPosts, getTrendingPosts, getEmployeesByDepartment, getTopPerformers, getUpcomingEvents, getEventsByAvailability, useTypeSafeOptions, };
//# sourceMappingURL=multiple-orderby.d.ts.map