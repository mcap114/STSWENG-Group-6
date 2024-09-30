# Continuation of CSSWENG-Group-1's Project

## Overview
This project is a tracking management web application developed for the Las Piñas Persons with Disabilities Federation Inc. (LPPWDFI) as part of the CSSWENG course. It includes various features and functionalities designed to manage and track services for persons with disabilities.

## Project Structure
- images/: Contains image assets used in the application.
- models/: Includes database models for data handling.
- node_modules/: Dependencies managed by Node.js.
- public/: Publicly accessible files like CSS and JavaScript.
- routes/: Server-side routing files.
- views/: Handlebars templates for rendering web pages.
- Server.js: The main server file to start the application.

# BRANCH STRUCTURE
- ## Main Branches (All changes must go through a pull request and code review before adding)
  - ### **main** <br />
      *Fully-tested* code that is stable and ready for production <br />
      **This branch will be used for deployment** <br />
  - ### **develop** <br />
      Latest merged changes still being tested for release
- ## Supporting Branches
  - ### **feature** <br />
      Adding new features derived from the `develop` branch, and merged back into it once complete <br />
      **Naming Convention:** <br />
      `feature/<feature-name>` <br /> <br />
  - ### **release** <br />
      Created when preparing a new release version, derived from `develop`, merged into `main` and `develop` once complete<br />
      **Naming Convention (use *[semantic versioning](https://arter.dev/semantic-versioning-cheat-sheet)):** <br />
      `release/<version-or-name>>` <br /> <br />
  - ### **hotfix** <br />
      Created to fix issues in `main`, merged into `main` and `develop` once complete <br />
      **Naming Convention:** <br />
      `hotfix/<issue-name>` <br /> <br />
 
  # MERGING STRATEGY SUMMARY
  Feature branches → merge into `develop`. <br />
  Release branches → created from `develop`, then merged into `main` and `develop`. <br />
  Hotfix branches → merged into both `main` and `develop` after fixing issues <br />

