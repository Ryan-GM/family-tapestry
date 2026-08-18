# Family Tapestry

Build a modern, interactive **Family Tree / Genealogy Web Application** that allows users to create and manage their family history visually.



### 1. Core Concept



The application must **not assume where the family tree begins**.



When a user creates a new family tree, they can:



* Start with themselves.

* Start with a parent, grandparent, ancestor, child, or any other family member.

* Add people above or below the starting person.

* Expand the tree indefinitely as more relatives are discovered.



The first person added becomes the initial/root node, but the system must treat this as a **starting point rather than the absolute origin of the family**.



The user should be able to restructure and expand the tree later.



---



### 2. Person / Family Member Profile



Every family member should be represented as an individual node/card containing:



* Full name

* First name

* Middle name

* Last name

* Date of birth

* Date of death — optional

* Gender

* Location/place of birth — optional

* Current/residential location — optional

* Occupation — optional

* Profile photo — optional

* Biography/notes — optional

* Relationship to other family members



Gender should be visually represented using a **clear gender icon** on the person's card.



Use recognizable icons rather than relying exclusively on color.



Example:



* Male → male/person icon

* Female → female/person icon

* Non-binary/other → neutral person icon

* Prefer not to say → neutral/unspecified icon



The system should allow the user to configure or extend gender options rather than hard-code only two genders.



---



### 3. Adding Family Members



Provide an intuitive **"Add Family Member"** interaction.



When viewing a person, the user should be able to select:



* Add Father

* Add Mother

* Add Parent

* Add Spouse/Partner

* Add Son

* Add Daughter

* Add Child

* Add Sibling

* Add Relative

* Add Family Member



If the exact relationship is unknown, allow:



**"Add Relative"**



The user can then establish or edit the relationship later.



When adding a person, display a form containing:



**Basic Information**



* First name

* Middle name

* Last name

* Date of birth

* Date of death

* Gender

* Profile photo



**Additional Information**



* Birthplace

* Residence

* Occupation

* Notes



**Relationship**



* Relationship type

* Connect to existing family member



---



### 4. Unknown / Incomplete Information



Genealogy data is often incomplete.



The application must therefore allow:



* Unknown date of birth

* Approximate date of birth

* Year only

* Unknown surname

* Unknown gender

* Unknown parent

* Unknown relationship

* Deceased person with unknown death date



Do not force users to provide information they don't know.



For example:



**John Mwangi**

Born: `~1942`



or:



**Mary [Surname Unknown]**

Born: `Unknown`



The UI should clearly distinguish between **unknown information** and information that simply hasn't been entered yet.



---



### 5. Family Tree Visualization



The primary interface should be a **large interactive family-tree canvas**.



Display family members as cards/nodes.



Each card should show:



**[Gender Icon]**

**John Mwangi**

Born: 1942

Died: 2018



Connections should visually represent relationships.



Example structure:



```text

                 Grandfather ─── Grandmother

                       │

              ┌────────┴────────┐

              │                 │

             Father            Aunt

              │

        ┌─────┴─────┐

        │           │

       User       Sibling

```



However, do not restrict the visualization to this exact structure.



The application should automatically arrange the tree based on the relationships entered.



---



### 6. Dynamic Tree Expansion



The tree should automatically update when a person is added.



For example:



1. User creates "John Mwangi".

2. Adds John's father.

3. Adds John's mother.

4. Adds John's siblings.

5. Adds John's spouse.

6. Adds John's children.

7. Adds the spouse's family.

8. Continues expanding across generations.



The user should never need to manually redraw the tree.



The visualization engine should calculate node positioning and relationship lines automatically.



---



### 7. Multiple Family Lines



The application must support multiple family lines.



For example:



```text

                     Father's Family

                           │

                     Grandfather

                           │

                         Father

                           │

                           User

                           │

                         Mother

                           │

                     Grandfather

                           │

                     Mother's Family

```



Users should be able to follow:



* Paternal lineage

* Maternal lineage

* Spouse's family

* Children's descendants

* Sibling branches



Provide visual controls for focusing on a particular family line.



---



### 8. Navigation



The family tree should support:



* Zoom in/out

* Pan

* Center tree

* Fit entire tree to screen

* Focus on selected person

* Search family members

* Navigate between generations

* Collapse/expand branches

* Hide/show spouses

* Hide/show descendants

* Hide/show ancestors



For large family trees, avoid rendering every person at maximum detail simultaneously.



---



### 9. Person Details Panel



Clicking a family member should open a side panel or modal showing their complete information.



Example:



**John Mwangi**



Male icon



Born: 14 March 1942

Died: 22 September 2018

Birthplace: Kiambu, Kenya

Occupation: Teacher



**Family**



Father: Peter Mwangi

Mother: Jane Wanjiku

Spouse: Mary Njeri

Children: 4



Include:



* Edit

* Add Relative

* View Family

* View Timeline

* Delete/Remove

* Add Photo



---



### 10. Relationship Model



Do not store the family tree purely as a visual structure.



Use a proper underlying **graph/relationship data model**.



Each person should have a unique ID.



Relationships should be stored separately.



For example:



```text

Person

 ├── id

 ├── firstName

 ├── lastName

 ├── dob

 ├── gender

 └── ...



Relationship

 ├── id

 ├── personA

 ├── personB

 └── relationshipType

```



This allows the same person to participate in multiple relationships without creating duplicate records.



For example, a person can simultaneously be:



* Someone's child

* Someone's sibling

* Someone's spouse

* Someone's parent



Avoid duplicating the person record.



---



### 11. Handling Unknown Starting Points



This is an important feature.



When creating a tree, show:



**"Where would you like to start?"**



But do not require the user to know their oldest ancestor.



Options:



* Start with myself

* Start with a family member

* Start with an ancestor

* Start with someone else



After creating the first person, display:



**"Who would you like to add?"**



with relationship options.



The user can therefore start anywhere and progressively discover their genealogy.



---



### 12. Timeline View



In addition to the tree view, create an optional **Family Timeline**.



Allow users to see important dates chronologically:



```text

1942 ── John is born

1965 ── John marries Mary

1967 ── First child born

1970 ── Second child born

2018 ── John dies

```



This gives the application value beyond simply displaying relationship lines.



---



### 13. Search



Implement global family search.



Users should be able to search by:



* Name

* Surname

* Birth year

* Location

* Occupation

* Relationship



Selecting a result should automatically focus the tree on that person.



---



### 14. Visual Design



Create a **modern, premium genealogy interface**.



Design direction:



* Clean

* Elegant

* Minimal

* Sophisticated

* Slightly futuristic

* High readability

* Desktop-first for large family trees

* Fully responsive for mobile



Use subtle animations when:



* Adding a person

* Expanding a branch

* Selecting a person

* Navigating between generations



The family tree should feel like an interactive map rather than a static diagram.



Avoid excessive decoration.



The family relationships should remain the visual priority.



---



### 15. Dashboard



Create a dashboard showing:



* Number of family members

* Number of generations

* Oldest known family member

* Most recently added member

* Number of family branches

* Upcoming birthdays

* Recently updated profiles



Example:



```text

Family Members       127

Generations           6

Known Ancestors       18

Family Branches        9

```



---



### 16. Privacy



Because genealogy information can contain sensitive personal information, implement:



* Authentication

* Private family trees by default

* Family-tree ownership

* Invite family members

* Role-based permissions

* View-only access

* Edit access

* Admin/owner access



Users should control who can view or modify their family tree.



---



### 17. Technical Architecture



Build the application using a scalable architecture.



Recommended stack:



**Frontend**



* React

* TypeScript

* React Flow or another graph visualization library

* CSS Modules or Styled Components



**Backend**



* Node.js

* Express

* REST API



**Database**



* PostgreSQL or MongoDB



The data model should prioritize **people + relationships**, not a rigid hierarchical tree structure.



Use a graph-oriented mental model even if the underlying database is relational/document-based.



---



### 18. Important UX Principle



Never make the user feel like they need to know their entire family history before using the application.



The application should support:



**Start → Add one person → Connect another person → Expand → Discover → Correct → Expand again.**



Information can be incomplete and corrected later.



The application should therefore behave more like a **living family knowledge graph** than a one-time family-tree form.



---



### 19. Future Features — Architect for Expansion



Structure the application so these can be added later:



* Family photos

* Family documents

* Birth certificates

* Marriage certificates

* Death records

* DNA/genealogy integrations

* Family stories

* Voice recordings

* Family events

* Family locations/map

* Automatic relationship calculation

* Import/export GEDCOM

* PDF family-tree generation

* Family tree sharing

* Collaborative editing

* Change history

* AI-assisted genealogy research



Do not implement all future features in the initial version, but design the architecture so they can be integrated without rebuilding the core data model.



### Primary Goal



Build a family-tree application where **the user does not need to know where their family tree begins**.



They simply enter the first person they know, and the application allows them to progressively construct their family history through relationships.



The core experience should be:



**Person → Relationship → Person → Relationship → Expansion**



rather than:



**Predefined Root → Fixed Hierarchy.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e55a3413-bc8e-43d8-aaab-6b40d4ee97f8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
