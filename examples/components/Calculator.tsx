/**
 * Calculator Component
 *
 * A fully functional calculator with MCP-UI integration.
 * Uses React's internal state for all calculations - no server communication required.
 */

import React, { useState, useCallback } from 'react'

// Type definition for initial data (exported for type validation)
export interface CalculatorProps {
  title?: string
  theme?: 'dark' | 'light'
}

declare global {
  interface Window {
    __INITIAL_DATA__?: CalculatorProps
  }
}

/**
 * Calculator Component
 */
export default function Calculator() {
  // Access data from window.__INITIAL_DATA__
  const data = typeof window !== 'undefined' ? window.__INITIAL_DATA__ : undefined
  const theme = data?.theme ?? 'dark'

  // Calculator state
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [history, setHistory] = useState('')

  // Input digit
  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }, [display, waitingForOperand])

  // Input decimal point
  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }, [display, waitingForOperand])

  // Clear all
  const clearAll = useCallback(() => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
    setHistory('')
  }, [])

  // Clear entry (just current display)
  const clearEntry = useCallback(() => {
    setDisplay('0')
  }, [])

  // Backspace
  const backspace = useCallback(() => {
    if (waitingForOperand) return
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }, [display, waitingForOperand])

  // Toggle sign
  const toggleSign = useCallback(() => {
    const value = parseFloat(display)
    setDisplay(String(-value))
  }, [display])

  // Input percent
  const inputPercent = useCallback(() => {
    const value = parseFloat(display)
    setDisplay(String(value / 100))
  }, [display])

  // Perform calculation
  const calculate = useCallback((leftOperand: number, rightOperand: number, op: string): number => {
    switch (op) {
      case '+':
        return leftOperand + rightOperand
      case '-':
        return leftOperand - rightOperand
      case '*':
        return leftOperand * rightOperand
      case '/':
        return rightOperand !== 0 ? leftOperand / rightOperand : NaN
      default:
        return rightOperand
    }
  }, [])

  // Handle operation
  const handleOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
      setHistory(`${inputValue} ${nextOperation}`)
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation)
      setDisplay(String(result))
      setPreviousValue(result)
      setHistory(`${result} ${nextOperation}`)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }, [display, previousValue, operation, calculate])

  // Handle equals
  const handleEquals = useCallback(() => {
    if (operation === null || previousValue === null) return

    const inputValue = parseFloat(display)
    const result = calculate(previousValue, inputValue, operation)

    setHistory(`${previousValue} ${operation} ${inputValue} =`)
    setDisplay(String(result))
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(true)
  }, [display, previousValue, operation, calculate])

  // Get button style based on type
  const getButtonStyle = (type: 'number' | 'operation' | 'equals' | 'function') => {
    const baseStyle = { ...styles.button }
    switch (type) {
      case 'number':
        return { ...baseStyle, ...styles.numberButton }
      case 'operation':
        return { ...baseStyle, ...styles.operationButton }
      case 'equals':
        return { ...baseStyle, ...styles.equalsButton }
      case 'function':
        return { ...baseStyle, ...styles.functionButton }
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>{data?.title || 'Calculator'}</div>
      </div>

      {/* Display */}
      <div style={styles.displayContainer}>
        <div style={styles.history}>{history || '\u00A0'}</div>
        <div style={styles.display}>{display}</div>
      </div>

      {/* Keypad */}
      <div style={styles.keypad}>
        {/* Row 1: AC, CE, <-, / */}
        <button onClick={clearAll} style={getButtonStyle('function')}>AC</button>
        <button onClick={clearEntry} style={getButtonStyle('function')}>CE</button>
        <button onClick={backspace} style={getButtonStyle('function')}>&#9003;</button>
        <button onClick={() => handleOperation('/')} style={getButtonStyle('operation')}>/</button>

        {/* Row 2: 7, 8, 9, * */}
        <button onClick={() => inputDigit('7')} style={getButtonStyle('number')}>7</button>
        <button onClick={() => inputDigit('8')} style={getButtonStyle('number')}>8</button>
        <button onClick={() => inputDigit('9')} style={getButtonStyle('number')}>9</button>
        <button onClick={() => handleOperation('*')} style={getButtonStyle('operation')}>*</button>

        {/* Row 3: 4, 5, 6, - */}
        <button onClick={() => inputDigit('4')} style={getButtonStyle('number')}>4</button>
        <button onClick={() => inputDigit('5')} style={getButtonStyle('number')}>5</button>
        <button onClick={() => inputDigit('6')} style={getButtonStyle('number')}>6</button>
        <button onClick={() => handleOperation('-')} style={getButtonStyle('operation')}>-</button>

        {/* Row 4: 1, 2, 3, + */}
        <button onClick={() => inputDigit('1')} style={getButtonStyle('number')}>1</button>
        <button onClick={() => inputDigit('2')} style={getButtonStyle('number')}>2</button>
        <button onClick={() => inputDigit('3')} style={getButtonStyle('number')}>3</button>
        <button onClick={() => handleOperation('+')} style={getButtonStyle('operation')}>+</button>

        {/* Row 5: +/-, 0, ., = */}
        <button onClick={toggleSign} style={getButtonStyle('function')}>+/-</button>
        <button onClick={() => inputDigit('0')} style={getButtonStyle('number')}>0</button>
        <button onClick={inputDecimal} style={getButtonStyle('number')}>.</button>
        <button onClick={handleEquals} style={getButtonStyle('equals')}>=</button>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>MCP-UI Calculator Demo</div>
      </div>
    </div>
  )
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '20px',
    padding: '24px',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '340px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  header: {
    marginBottom: '16px',
    textAlign: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    opacity: 0.9,
    letterSpacing: '0.5px',
  },
  displayContainer: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '20px',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  history: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '8px',
    minHeight: '20px',
  },
  display: {
    fontSize: '42px',
    fontWeight: '300',
    letterSpacing: '-1px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '20px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  numberButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
  operationButton: {
    background: 'rgba(99, 102, 241, 0.8)',
    color: 'white',
  },
  equalsButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
  },
  functionButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '16px',
  },
  footer: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: '11px',
    textAlign: 'center',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
}
