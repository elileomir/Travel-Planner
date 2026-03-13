import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import AppShell from '@/components/AppShell';

export default function Home() {
  // Read CSVs directly from disk since this runs on Node server
  const itineraryPath = path.join(process.cwd(), 'baguio_lu_itinerary_mar19_25_2026_with_coords.csv');
  const foodPath = path.join(process.cwd(), 'baguio_lu_food_guide_with_coords.csv');
  const spotsPath = path.join(process.cwd(), 'baguio_lu_tourist_spots_guide_with_coords.csv');

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
