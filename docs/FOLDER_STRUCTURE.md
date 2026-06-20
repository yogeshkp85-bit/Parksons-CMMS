# Folder Structure Specification

This document defines the standardized folder structure for the enterprise CMMS repository.

## Root Directory

```text
parksons-cmms-dev/
├── frontend/           
├── backend/            
├── database/           
├── docs/               
├── architecture/       
├── screens/            
├── reports/            
├── tests/              
├── github/             
├── assets/             
├── uploads/            
├── scripts/            
├── config/             
└── PROJECT_PROGRESS.md 
```

## Backend Structure (`backend/`)

```text
backend/
├── prisma/             
├── src/
│   ├── controllers/    
│   ├── services/       
│   ├── repositories/   
│   ├── routes/         
│   ├── middlewares/    
│   ├── validators/     
│   ├── dto/            
│   ├── types/          
│   ├── utils/          
│   ├── cron/           
│   ├── jobs/           
│   ├── config/         
│   └── logs/           
├── package.json        
└── .env                
```

## Frontend Structure (`frontend/`)

```text
frontend/
├── src/
│   ├── components/     
│   ├── pages/          
│   ├── layouts/        
│   ├── services/       
│   ├── hooks/          
│   ├── context/        
│   ├── types/          
│   ├── constants/      
│   ├── utils/          
│   └── assets/         
├── package.json        
└── .env                
```
