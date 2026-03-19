import './SkeletonLoader.css';

export function MenuCardSkeleton() {
    return (
        <div className="menu-card-skeleton">
            <div className="skeleton-img" />
            <div className="skeleton-text skeleton-name" />
            <div className="skeleton-text skeleton-desc" />
            <div className="skeleton-bottom">
                <div className="skeleton-text skeleton-price" />
                <div className="skeleton-text skeleton-qty" />
            </div>
        </div>
    );
}

export function InventoryCardSkeleton() {
    return (
        <div className="inventory-card-skeleton">
            <div className="skeleton-img" />
            <div className="skeleton-text skeleton-name" />
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-footer">
                <div className="skeleton-button" />
                <div className="skeleton-button" />
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="table-row-skeleton">
            <div className="skeleton-cell skeleton-img-small" />
            <div className="skeleton-cell">
                <div className="skeleton-text skeleton-name" />
            </div>
            <div className="skeleton-cell">
                <div className="skeleton-text skeleton-text-sm" />
            </div>
            <div className="skeleton-cell">
                <div className="skeleton-text skeleton-text-sm" />
            </div>
            <div className="skeleton-cell">
                <div className="skeleton-button-small" />
            </div>
        </div>
    );
}

export function SkeletonGrid({ count = 6, type = 'menu' }) {
    const SkeletonComponent = type === 'inventory' ? InventoryCardSkeleton : MenuCardSkeleton;
    
    return (
        <div className={`skeleton-grid skeleton-grid-${type}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5 }) {
    return (
        <div className="skeleton-table">
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} />
            ))}
        </div>
    );
}
