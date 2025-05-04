


export function isValidEmail(email: string): boolean 
{
    if (email.trim().length === 0)
        return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


export function isValidFieldLen(field: string, min: number, max: number): boolean 
{
    if (field.trim().length < min)
        return false;
    if (field.trim().length > max)
        return false;
    return true;
}
