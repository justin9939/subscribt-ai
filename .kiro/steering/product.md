# Product: Subscribt AI

## Overview

Subscribt AI is a dual-sided policy analysis platform that lets organizations and their employees query uploaded policy documents — Codes of Conduct, Laws, Workplace Rights documents, and similar — using AI. The core promise is translating dense legalese into actionable, accurate guidance while maintaining 100% fidelity to source material.

## Two Personas

### HR Managers
- Upload and manage policy documents
- Focus: risk mitigation, compliance gap analysis, policy drafting assistance
- Access: aggregated trend data on query topics
- Cannot see individual employee queries or identities

### Employees (Default)
- Query uploaded documents to understand their rights and obligations
- Focus: plain-language clarity, rights lookup, scenario testing ("what happens if...")
- **This is the default persona for all users** — students, members of the public, or anyone querying policies without an explicit role assignment lands here automatically

## Core Principles

### Strict Grounding (Non-Negotiable)
The AI must never hallucinate or infer beyond the source document. If the answer is not present in the uploaded policy:
- Response must state: **"Not addressed in the provided policy."**
- No extrapolation, no general legal advice, no filling gaps with external knowledge

### Verifiable Citations
Every AI response must include a direct reference to the source — either:
- A snippet/excerpt from the relevant section of the PDF
- A page number, section heading, or clause identifier the user can verify themselves

## Key Capabilities

- **Document ingestion**: Upload PDFs (Codes of Conduct, employment law, workplace rights, internal policies)
- **Natural language querying**: Ask questions in plain English, receive grounded answers
- **Gap analysis** (HR): Identify topics not covered by current policy documents
- **Scenario testing** (Employee): "What does the policy say about X situation?"
- **Policy drafting assistance** (HR): Suggest language to address identified gaps, grounded in uploaded reference documents

## Success Criteria

- Zero hallucinated responses — every claim traceable to a source document
- Employees can self-serve answers without legal or HR intermediary
- HR can identify policy gaps and trending concerns
