import { useState } from 'react';
import './Calculator.css';

export default function Calculator({ value, onChange }) {
    const [display, setDisplay] = useState(value?.toString() || '0');
    const [equation, setEquation] = useState('');

    const handleNumber = (num) => {
        if (display === '0') {
            setDisplay(num);
        } else {
            setDisplay(display + num);
        }
    };

    const handleOperator = (op) => {
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
    };

    const handleBackspace = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
        }
    };

    const handleDecimal = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const handleEquals = () => {
        try {
            const fullEquation = equation + display;
            const result = eval(fullEquation); // Note: In production, use a safer eval alternative
            const finalValue = parseFloat(result.toFixed(2));
            setDisplay(finalValue.toString());
            setEquation('');
            onChange(finalValue);
        } catch (error) {
            setDisplay('Error');
            setEquation('');
        }
    };

    const handleDone = () => {
        const finalValue = parseFloat(display) || 0;
        onChange(finalValue);
    };

    return (
        <div className="calculator">
            <div className="calculator-display">
                {equation && <div className="calculator-equation">{equation}</div>}
                <div className="calculator-value">{display}</div>
            </div>

            <div className="calculator-buttons">
                <button type="button" className="calc-btn calc-clear" onClick={handleClear}>C</button>
                <button type="button" className="calc-btn calc-operator" onClick={handleBackspace}>⌫</button>
                <button type="button" className="calc-btn calc-operator" onClick={() => handleOperator('/')}>÷</button>
                <button type="button" className="calc-btn calc-operator" onClick={() => handleOperator('*')}>×</button>

                <button type="button" className="calc-btn" onClick={() => handleNumber('7')}>7</button>
                <button type="button" className="calc-btn" onClick={() => handleNumber('8')}>8</button>
                <button type="button" className="calc-btn" onClick={() => handleNumber('9')}>9</button>
                <button type="button" className="calc-btn calc-operator" onClick={() => handleOperator('-')}>−</button>

                <button type="button" className="calc-btn" onClick={() => handleNumber('4')}>4</button>
                <button type="button" className="calc-btn" onClick={() => handleNumber('5')}>5</button>
                <button type="button" className="calc-btn" onClick={() => handleNumber('6')}>6</button>
                <button type="button" className="calc-btn calc-operator" onClick={() => handleOperator('+')}>+</button>

                <button type="button" className="calc-btn" onClick={() => handleNumber('1')}>1</button>
                <button type="button" className="calc-btn" onClick={() => handleNumber('2')}>2</button>
                <button type="button" className="calc-btn" onClick={() => handleNumber('3')}>3</button>
                <button type="button" className="calc-btn calc-equals" onClick={handleEquals}>=</button>

                <button type="button" className="calc-btn calc-zero" onClick={() => handleNumber('0')}>0</button>
                <button type="button" className="calc-btn" onClick={handleDecimal}>.</button>
                <button type="button" className="calc-btn calc-done" onClick={handleDone}>Done</button>
            </div>
        </div>
    );
}
