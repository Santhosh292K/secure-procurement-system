'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (otp: string) => void;
    disabled?: boolean;
    error?: boolean;
}

export default function OTPInput({
    length = 6,
    value,
    onChange,
    disabled = false,
    error = false
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Update internal state when value prop changes
    useEffect(() => {
        if (value) {
            const otpArray = value.split('').slice(0, length);
            while (otpArray.length < length) {
                otpArray.push('');
            }
            setOtp(otpArray);
        }
    }, [value, length]);

    const handleChange = (index: number, digit: string) => {
        // Only allow single digit
        if (digit.length > 1) {
            digit = digit[digit.length - 1];
        }

        // Only allow numbers
        if (digit && !/^\d$/.test(digit)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        // Call onChange with the complete OTP string
        onChange(newOtp.join(''));

        // Auto-focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current input is empty, focus previous and clear it
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                onChange(newOtp.join(''));
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
                onChange(newOtp.join(''));
            }
        }
        // Handle left arrow
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Handle right arrow
        else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);

        if (pastedData) {
            const newOtp = pastedData.split('');
            while (newOtp.length < length) {
                newOtp.push('');
            }
            setOtp(newOtp);
            onChange(newOtp.join(''));

            // Focus last filled input or last input
            const focusIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`
                        w-12 h-14 text-center text-2xl font-bold
                        bg-secondary border-2 rounded-lg
                        text-foreground placeholder-muted-foreground
                        focus:outline-none focus:ring-2 focus:ring-primary/20
                        transition-all duration-200
                        ${error
                            ? 'border-destructive focus:border-destructive'
                            : 'border-transparent focus:border-primary'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
                    `}
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    );
}
