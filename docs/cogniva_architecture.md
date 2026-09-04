# Cogniva Architecture Diagram

> [!TIP]
> I have also designed a highly polished, stylized HTML version of this diagram that perfectly visually matches your original reference image (with emojis, custom arrows, and exact layout colors). 
> You can open it in your browser: [cogniva_architecture.html](file:///d:/projects/Cogniva/docs/cogniva_architecture.html)

Here is the functional, embeddable Mermaid flowchart version of the requested architecture:

```mermaid
graph TD
    %% Styling
    classDef branch1 fill:#1E88E5,stroke:#000,stroke-width:2px,color:#fff,font-weight:bold,border-radius:10px
    classDef branch2 fill:#FB8C00,stroke:#000,stroke-width:2px,color:#fff,font-weight:bold,border-radius:10px
    classDef branch3 fill:#43A047,stroke:#000,stroke-width:2px,color:#fff,font-weight:bold,border-radius:10px
    classDef auth fill:#E3F2FD,stroke:#1E88E5,stroke-width:2px,font-weight:bold,border-radius:20px
    classDef login fill:#64B5F6,stroke:#000,stroke-width:2px,color:#fff,font-weight:bold,border-radius:20px
    classDef central fill:#ffffff,stroke:#000,stroke-width:2px,font-weight:bold
    classDef general fill:#ffffff,stroke:#333,stroke-width:2px
    classDef reward fill:#F1F8E9,stroke:#4CAF50,stroke-width:2px,font-weight:bold
    
    %% Top layer
    U["👨‍💼👩‍💻 User (Employee/Admin)"] --> L["👤 LOG IN"]:::login
    L --> A["🛡️ Authentication \n(Role-Based)"]:::auth
    
    %% Central split
    U --> C["🧠🤖 Orchestrator Agent \n(Intelligent Routing)"]:::central
    
    %% Split into 3
    C -->|Direct Retrieval| B1["SEARCH PIPELINE"]:::branch1
    C -->|Complex Task| B2["AI GENERATION"]:::branch2
    C -->|Background Event| B3["ENTERPRISE AUTOMATION"]:::branch3
    
    %% Left Branch (Blue)
    B1 --> S1["🔍 Semantic Vector Search"]:::general
    S1 --> S2["✔️ ChromaDB Retrieval"]:::auth
    S2 --> S3["📜 Grounded Response"]:::general
    S3 --> SYNC["🔄 Memory Agent Sync"]:::general
    
    %% Middle Branch (Orange)
    B2 --> O0["📥 Async Task Initiated"]:::branch3
    O0 --> O1["🧠 Context Analysis"]:::general
    O1 --> O2["⚙️ Async LLM Processing"]:::general
    O2 --> O3["💬 Streamed Output"]:::general
    O3 --> SYNC
    
    %% Right Branch (Green)
    B3 --> E1["⚡ n8n Knowledge Gap"]:::general
    E1 --> E2["🏛️ Admin Routing"]:::general
    E2 --> E3["✔️ Verified"]:::auth
    E3 --> E4["💡 Insight Alerts"]:::reward
    
    %% Bottom Banner
    subgraph Conceptual Framework
    direction LR
        F1["🔐 Strict Role-Based Access"]:::general
        F2["🖥️ Device-Aware NLP"]:::general
        F3["🗄️ PostgreSQL Master Sync"]:::general
        F4["🌐 Multi-Agent Ecosystem"]:::general
        F1 --- F2 --- F3 --- F4
    end
    
    style Conceptual Framework fill:#FAFAFA,stroke:#9E9E9E,stroke-dasharray: 5 5
```
