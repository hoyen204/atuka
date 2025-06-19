export function formatDateSafe(date: string | Date | null | undefined): string {
  if (!date) return 'Chưa cập nhật';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Lỗi định dạng ngày';
  }
}

export function formatDateTimeSafe(date: string | Date | null | undefined): string {
  if (!date) return 'Chưa cập nhật';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return 'Lỗi định dạng ngày giờ';
  }
}

export function calculateDaysRemaining(expiredDate: string | Date | null | undefined): number | undefined {
  if (!expiredDate) return undefined;
  
  try {
    const dateObj = typeof expiredDate === 'string' ? new Date(expiredDate) : expiredDate;
    
    if (isNaN(dateObj.getTime())) {
      return undefined;
    }

    const today = new Date();
    const diffTime = dateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('Days calculation error:', error);
    return undefined;
  }
}

export function isDateExpired(expiredDate: string | Date | null | undefined): boolean {
  if (!expiredDate) return false;
  
  try {
    const dateObj = typeof expiredDate === 'string' ? new Date(expiredDate) : expiredDate;
    
    if (isNaN(dateObj.getTime())) {
      return true;
    }

    return dateObj.getTime() < new Date().getTime();
  } catch (error) {
    console.error('Date expiry check error:', error);
    return true;
  }
} 