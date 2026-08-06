# StreetApp

A full-stack research platform for documenting and analysing street art through geolocated user submissions.

StreetApp was developed as a digital research tool supporting the collection of structured data about street art. Users can document artworks, associate them with geographical locations and explore submitted content through an interactive map-based interface.

The application was originally created to support academic research into the social perception of street art as part of the linguistic landscape.

## Key Features

* Interactive map displaying documented street-art locations
* Creation and management of geolocated submissions
* Collection of structured information about individual artworks
* Integration with geocoding services
* User authentication and protected application functionality
* Multilingual user interface
* REST-based communication between frontend and backend
* Containerised backend deployment

## Technology Stack

### Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* JWT and OAuth2
* REST API
* Relational database
* Maven
* Docker

### Frontend

* React
* TypeScript
* React Router
* Leaflet and React Leaflet
* PrimeReact
* i18next

## Architecture

StreetApp uses a separated frontend and backend architecture. The backend provides REST endpoints responsible for authentication, data management and geocoding integration, while the React application provides the map-based user interface.

The backend follows a layered structure based on controllers, services, repositories, DTOs, mappers and domain entities.

## Project Background

StreetApp combines software development with applied linguistic research. It was used as part of a master’s research project and presented at an academic conference at Adam Mickiewicz University in Poznań.

The project demonstrates how custom software can support the collection and analysis of research data that would be difficult to obtain through a traditional survey alone.

## Repository Structure

This repository contains the frontend part of StreetApp.

The corresponding backend repository is available on my GitHub profile.

## Status
Finished

The application is functional and continues to be improved, with planned work focused on testing, documentation, deployment automation and further development of the research workflow.
