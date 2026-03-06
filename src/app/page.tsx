import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import AppShell from '@/components/AppShell';

export default function Home() {
  // Read CSVs directly from disk since this runs on Node server
  const itineraryPath = path.join(process.cwd(), 'data', 'baguio_itinerary_march_2026.csv');
  const foodPath = path.join(process.cwd(), 'data', 'baguio_food_guide.csv');
  const spotsPath = path.join(process.cwd(), 'data', 'baguio_tourist_spots_guide.csv');

  let itineraryData: any[] = [];
  let foodData: any[] = [];
  let spotsData: any[] = [];

  try {
    itineraryData = parse(fs.readFileSync(itineraryPath, 'utf8'), { columns: true, skip_empty_lines: true });
    foodData = parse(fs.readFileSync(foodPath, 'utf8'), { columns: true, skip_empty_lines: true });
    spotsData = parse(fs.readFileSync(spotsPath, 'utf8'), { columns: true, skip_empty_lines: true });
  } catch (err) {
    console.error("Failed to parse CSVs:", err);
  }

  return <AppShell itineraryData={itineraryData} foodData={foodData} spotsData={spotsData} />;
}
