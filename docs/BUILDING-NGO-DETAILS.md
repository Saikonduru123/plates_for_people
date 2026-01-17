# 🎯 Building: NGO Details Page

## Overview
Route: `/donor/ngo/:id`
Time Estimate: 1 hour
Status: IN PROGRESS 🚧

## What We're Building

A detailed view page for a single NGO showing:
1. Organization information card
2. Location on map (single marker)
3. Contact details (phone, person)
4. Operating hours
5. Capacity information
6. Average rating + review count
7. Recent reviews list
8. **"Create Donation Request" button** → navigates to create donation form

## API Endpoints to Use

1. **GET /ngos/{id}** - Get NGO profile
2. **GET /ngo-locations/** - Get NGO locations (filter by NGO)
3. **GET /ratings/ngo/{ngo_id}/summary** - Get rating statistics
4. **GET /ratings/** - Get reviews for NGO

## Components to Create

1. `src/pages/donor/NGODetails.tsx` - Main page
2. `src/pages/donor/NGODetails.css` - Styling
3. `src/components/ngo/ContactCard.tsx` - Contact information
4. `src/components/ngo/RatingsSummary.tsx` - Rating display with stars

## Starting Now...
