"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import PhoneInputWithCountry, {
  isValidPhoneNumber,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  className?: string
  initialValue?: string
  defaultValue?: string
  disabled?: boolean
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, className, disabled}) => {
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(value || "");
  // const [isValid, setIsValid] = useState<boolean>(true);

  // Validate phone number whenever it changes
  // useEffect(() => {
  //   if (phoneNumber) {
  //     setIsValid(isValidPhoneNumber(phoneNumber));
  //   }
  // }, [phoneNumber]);

  const handleChange = (value: string | undefined) => {
    setPhoneNumber(value || "");
    onChange(value || "");
  };

  return (
      <PhoneInputWithCountry
        value={phoneNumber}
        onChange={handleChange}
        defaultCountry="PK"
        placeholder="Enter phone number"
        className={cn("!outline-0", className)}
        international
        countrySelectProps={{ withCallingCode: true }} // This enables showing country code with flag
        limitMaxLength
        disabled={disabled}
      />
  );
};

export default PhoneInput;
