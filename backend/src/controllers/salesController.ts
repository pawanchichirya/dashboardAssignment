import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface SalesRecord {
  "Row ID": number;
  "Order ID": string;
  "Order Date": string;
  "Ship Date": string;
  "Ship Mode": string;
  "Customer ID": string;
  "Customer Name": string;
  "Segment": string;
  "Country": string;
  "City": string;
  "State": string;
  "Postal Code": number;
  "Region": string;
  "Product ID": string;
  "Category": string;
  "Sub-Category": string;
  "Product Name": string;
  "Sales": number;
  "Quantity": number;
  "Discount": number;
  "Profit": number;
}

// Read sales data from JSON file
const getSalesData = (): SalesRecord[] => {
  try {
    const filePath = path.join(__dirname, '../data/sales.json');
    console.log('Reading sales data from:', filePath);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const salesData = JSON.parse(rawData);
    console.log('Successfully loaded sales data. Number of records:', salesData.length);
    return salesData;
  } catch (error) {
    console.error('Error reading sales data:', error);
    return [];
  }
};

export const getStates = (req: Request, res: Response) => {
  try {
    const states = [...new Set(getSalesData().map((record: SalesRecord) => record.State))];
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch states' });
  }
};

export const getDateRange = (req: Request, res: Response) => {
  try {
    const { state } = req.params;
    const stateRecords = getSalesData().filter((record: SalesRecord) => record.State === state);
    
    if (stateRecords.length === 0) {
      return res.status(404).json({ error: 'State not found' });
    }

    const dates = stateRecords.map((record: SalesRecord) => new Date(record["Order Date"]));
    const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));

    res.json({
      minDate: minDate.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch date range' });
  }
};

export const getDashboardData = (req: Request, res: Response) => {
  try {
    const { state, startDate, endDate } = req.query;
    console.log('Received request with params:', { state, startDate, endDate });

    const salesData = getSalesData();
    if (salesData.length === 0) {
      throw new Error('No sales data available');
    }

    let filteredData = [...salesData];

    // Filter by state if specified
    if (state && state !== 'All States') {
      filteredData = filteredData.filter(record => record.State === state);
      console.log('Filtered by state. Records remaining:', filteredData.length);
    }

    // Filter by date range
    if (startDate && endDate) {
      filteredData = filteredData.filter(record => {
        const recordDate = new Date(record["Order Date"]);
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        return recordDate >= start && recordDate <= end;
      });
      console.log('Filtered by date range. Records remaining:', filteredData.length);
    }

    // Calculate totals
    const totalSales = filteredData.reduce((sum, record) => sum + record.Sales, 0);
    const quantitySold = filteredData.reduce((sum, record) => sum + record.Quantity, 0);
    const totalDiscount = filteredData.reduce((sum, record) => sum + (record.Sales * record.Discount), 0);
    const totalProfit = filteredData.reduce((sum, record) => sum + record.Profit, 0);
    const discountPercentage = totalSales > 0 ? (totalDiscount / totalSales) * 100 : 0;

    // Calculate sales by city
    const salesByCity = filteredData.reduce((acc, record) => {
      acc[record.City] = (acc[record.City] || 0) + record.Sales;
      return acc;
    }, {} as { [key: string]: number });

   // Step 1: Create an object that maps each product name to its total sales
const productSalesMap: { [key: string]: number } = {};

for (const record of filteredData) {
  const productName = record["Product Name"];
  productSalesMap[productName] = (productSalesMap[productName] || 0) + record.Sales;
}

// Step 2: Convert the object to an array and sort it by sales in descending order
const top10Products = Object.entries(productSalesMap)
  .sort((a, b) => b[1] - a[1]) // sort by sales (value)
  .slice(0, 10)                // take top 10
  .map(([name, sales]) => ({ name, sales })); // format as objects

// Now `top10Products` contains:
// [
//   { name: 'Product A', sales: 5000 },
//   { name: 'Product B', sales: 4500 },
//   ...
// ]


    // Calculate sales by category
    const salesByCategory = filteredData.reduce((acc, record) => {
      acc[record.Category] = (acc[record.Category] || 0) + record.Sales;
      return acc;
    }, {} as { [key: string]: number });

    // Calculate sales by sub-category
    const salesBySubCategory = Object.entries(
      filteredData.reduce((acc, record) => {
        acc[record["Sub-Category"]] = (acc[record["Sub-Category"]] || 0) + record.Sales;
        return acc;
      }, {} as { [key: string]: number })
    ).map(([name, value]) => ({ name, value }));

    // Calculate sales by segment
    const salesBySegment = filteredData.reduce((acc, record) => {
      acc[record.Segment] = (acc[record.Segment] || 0) + record.Sales;
      return acc;
    }, {} as { [key: string]: number });

    const response = {
      totalSales: Math.round(totalSales),
      quantitySold,
      discountPercentage: Math.round(discountPercentage * 10) / 10,
      totalProfit: Math.round(totalProfit),
      salesByCity,
      salesByProducts: top10Products,
      salesByCategory,
      salesBySubCategory,
      salesBySegment
    };

    console.log('Sending response with data:', {
      totalSales: response.totalSales,
      recordCount: filteredData.length
    });

    res.json(response);
  } catch (error) {
    console.error('Error processing dashboard data:', error);
    res.status(500).json({ error: 'Failed to process dashboard data' });
  }
}; 
