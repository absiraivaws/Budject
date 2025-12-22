import './Button.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    ...props
}) {
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const iconOnlyClass = icon && !children ? 'btn-icon' : '';

    return (
        <button
            type={type}
            className={`btn ${variantClass} ${sizeClass} ${iconOnlyClass} ${className}`.trim()}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {icon && <span className="btn-icon-wrapper">{icon}</span>}
            {children}
        </button>
    );
}
