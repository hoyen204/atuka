import { userShopParser } from '../lib/user-shop-parser';
import { UserShopExtractedData } from '../types/shop/user-shop';

export async function extractUserShopData(htmlContent: string): Promise<UserShopExtractedData> {
  try {
    const extractedData = userShopParser.parseUserShopHtml(htmlContent);
    
    console.log('User Shop Data Extracted:');
    console.log(`- PhapBao Items: ${extractedData.phapBaoItems.length}`);
    console.log(`- DongHanh Items: ${extractedData.dongHanhItems.length}`);
    console.log(`- BonMenh Items: ${extractedData.bonMenhItems.length}`);
    console.log(`- DanDuoc Items: ${extractedData.danDuocItems.length}`);
    console.log(`- NangCap Items: ${extractedData.nangCapItems.length}`);
    
    return extractedData;
  } catch (error) {
    console.error('Error extracting user shop data:', error);
    throw error;
  }
} 