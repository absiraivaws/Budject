import { useState, useEffect } from 'react';

/**
 * Custom hook for managing drag-and-drop order of items
 * @param {Array} items - Array of items with id property
 * @param {string} storageKey - localStorage key for persisting order
 * @returns {Object} - { orderedItems, handleDragEnd }
 */
export function useDragDropOrder(items, storageKey) {
    const [itemOrder, setItemOrder] = useState(() => {
        // Try to load saved order from localStorage
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing saved order:', e);
                return items.map(item => item.id);
            }
        }
        return items.map(item => item.id);
    });

    // Update order when items change (new items added/removed)
    useEffect(() => {
        const currentIds = items.map(item => item.id);
        const savedIds = itemOrder.filter(id => currentIds.includes(id));
        const newIds = currentIds.filter(id => !itemOrder.includes(id));

        if (savedIds.length !== currentIds.length || newIds.length > 0) {
            const updatedOrder = [...savedIds, ...newIds];
            setItemOrder(updatedOrder);
            localStorage.setItem(storageKey, JSON.stringify(updatedOrder));
        }
    }, [items, itemOrder, storageKey]);

    // Sort items according to saved order
    const orderedItems = [...items].sort((a, b) => {
        const indexA = itemOrder.indexOf(a.id);
        const indexB = itemOrder.indexOf(b.id);

        // If item not in order, put it at the end
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    });

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        setItemOrder((items) => {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);

            // Array move helper
            const newOrder = [...items];
            const [removed] = newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, removed);

            // Save to localStorage
            localStorage.setItem(storageKey, JSON.stringify(newOrder));

            return newOrder;
        });
    };

    return {
        orderedItems,
        handleDragEnd
    };
}
