# HLM-Web

<p align="center">
    <img width="350" src = https://github.com/uihilab/HLM-Web/raw/main/images/WebHLM-color.png>
</p>

## Table of Contents
* [Introduction](#introduction)
* [About HLM](#about-hlm)
* [Getting Started](#getting-started)
* [Acknowledgements](#acknowledgements)
* [References](#references)

## Introduction
HLM-Web is a physically-based, rainfall-runoff modelling engine capable of providing operational level results using client-side compute while running in a browser.
"HLM" stands for the Hillslope Link Model, which is a family of mathematical models that describe rainfall-runoff and streamflow generation processes. 
"Web" indicates that the package runs natively using modern web standards (i.e., JavaScript.)

## About HLM
HLM is a family of mathematical models that describe the physical processes of rainfall-runoff response and streamflow generation from a river network.
Importantly, the directed tree structure of the river network aides in the computation of the numerical solution.
HLM and a numerical solver have been implemented in other languages, namely in the [C Programming Language](https://asynch.readthedocs.io/en/latest/index.html) for the Iowa Flood Center's flood forecasting tool.
Currently implemented, HLW-Web is packaged with both constant and variable rainfall-runoff models.
[Many more models exist](https://asynch.readthedocs.io/en/latest/builtin_models.html) in the C Programming Language implementation.
Thus, **additional models can easily be added upon need and request**.

## Getting Started
This repo includes two versions of HLM-Web; **Standard** and **BMI**.

### Standard
**We encourage reading this documentation first.**

The standard version is a standalone application.

**Usage**: This version is best suited for those who intend to run HLM-Web alone without any need to couple the HLM-Web simulation external models or data.

With this version we provide significant documentation and benchmarking results to show that HLM-Web's outputs correspond with the results from the previous C programming language implementation of the model.
This version has been documented in the literature and currently supports educational web applications. 
(See the references section below for a link to the pre-print.)

### HLM-Web, BMI Version
The second is an implementation of HLM-Web which complies with the [Basic Model Interface (BMI)](https://bmi-spec.readthedocs.io/en/latest/index.html) specification.

**Usage**: This version is best suited for those who intend to couple external data sources or models with HLM-Web.

Its documentation focuses more on its differences with and its capabilities beyond the standard implementation.
A publication demonstrating its use is forthcoming.


## Acknowledgements
This project is supported by the [University of Iowa Hydroinformatics Lab (UIHI Lab)](https://hydroinformatics.uiowa.edu/).

## References
Gregory Ewing, Ricardo Mantilla, Witold Krajewski, & Ibrahim Demir. Interactive Hydrological Modelling and Simulation on Client-Side Web Systems: An Educational Case Study [Preprint, to Journal of Hydroinformatics](https://eartharxiv.org/repository/view/3260/).

[in preparation] Gregory Ewing, Carlos Erazo Ramirez, Ashani Vaidya, & Ibrahim Demir. Coupling Web-based Hydrologic Tools via the BMI Specification for JavaScript
