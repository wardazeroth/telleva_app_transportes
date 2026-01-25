import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Configurar un temporizador
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpiar el temporizador si el valor cambia antes de que termine el tiempo
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}