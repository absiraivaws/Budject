import './Card.css';

export default function Card({
    children,
    title,
    glass = false,
    className = '',
    ...props
}) {
    const cardClass = glass ? 'card card-glass' : 'card';

    return (
        <div className={`${cardClass} ${className}`.trim()} {...props}>
            {title && (
                <div className="card-header">
                    <h3 className="card-title">{title}</h3>
                </div>
            )}
            {children}
        </div>
    );
}
