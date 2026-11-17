"""Demo students, their lockers and sample courses (no passwords here)."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class DemoCourse:
    title: str
    paragraphs: list[str]


@dataclass(frozen=True)
class DemoLocker:
    name: str
    color: str
    courses: list[DemoCourse] = field(default_factory=list)


@dataclass(frozen=True)
class DemoStudent:
    email: str
    first_name: str
    username: str
    track: str
    plan_code: str
    lockers: list[DemoLocker] = field(default_factory=list)


DEMO_STUDENTS = [
    DemoStudent(
        email="demo.ines@nexus.test",
        first_name="Inès",
        username="ines_demo",
        track="mpsi",
        plan_code="premium",
        lockers=[
            DemoLocker(
                name="Mathématiques",
                color="#4338ca",
                courses=[
                    DemoCourse(
                        title="Suites numériques",
                        paragraphs=[
                            "Une suite numérique est une fonction de N dans R. "
                            "On note u(n) le terme de rang n.",
                            "Une suite arithmétique vérifie u(n+1) = u(n) + r, "
                            "où r est la raison. Une suite géométrique vérifie "
                            "u(n+1) = q * u(n).",
                            "Une suite converge si ses termes se rapprochent "
                            "d'une limite finie. Toute suite croissante et "
                            "majorée converge.",
                        ],
                    ),
                    DemoCourse(
                        title="Intégration sur un segment",
                        paragraphs=[
                            "L'intégrale d'une fonction continue sur [a, b] "
                            "mesure l'aire algébrique sous sa courbe.",
                            "Si F est une primitive de f, alors l'intégrale "
                            "de a à b de f vaut F(b) - F(a).",
                            "L'intégration par parties s'écrit : intégrale de "
                            "u'v = [uv] - intégrale de uv'.",
                        ],
                    ),
                ],
            ),
            DemoLocker(
                name="Physique-Chimie",
                color="#0e7490",
                courses=[
                    DemoCourse(
                        title="Mécanique du point",
                        paragraphs=[
                            "Dans un référentiel galiléen, la somme des forces "
                            "appliquées à un point matériel est égale au "
                            "produit de sa masse par son accélération.",
                            "Le théorème de l'énergie cinétique relie la "
                            "variation d'énergie cinétique au travail des forces.",
                        ],
                    ),
                ],
            ),
            DemoLocker(
                name="Informatique",
                color="#6d28d9",
                courses=[
                    DemoCourse(
                        title="Algorithmes de tri",
                        paragraphs=[
                            "Le tri par insertion insère chaque élément à sa "
                            "place dans la partie déjà triée. Sa complexité "
                            "est quadratique dans le pire cas.",
                            "Le tri fusion divise la liste en deux, trie chaque "
                            "moitié puis fusionne : sa complexité est en "
                            "n log n.",
                        ],
                    ),
                ],
            ),
        ],
    ),
    DemoStudent(
        email="demo.lucas@nexus.test",
        first_name="Lucas",
        username="lucas_demo",
        track="bcpst",
        plan_code="basic",
        lockers=[
            DemoLocker(
                name="Biologie",
                color="#166534",
                courses=[
                    DemoCourse(
                        title="La cellule eucaryote",
                        paragraphs=[
                            "La cellule eucaryote possède un noyau délimité "
                            "par une enveloppe nucléaire, qui contient l'ADN.",
                            "Ses organites, comme les mitochondries ou le "
                            "réticulum endoplasmique, assurent des fonctions "
                            "spécialisées.",
                        ],
                    ),
                ],
            ),
            DemoLocker(
                name="Chimie",
                color="#b45309",
                courses=[
                    DemoCourse(
                        title="Cinétique chimique",
                        paragraphs=[
                            "La vitesse d'une réaction dépend de la "
                            "concentration des réactifs et de la température.",
                            "La loi d'Arrhenius relie la constante de vitesse "
                            "à l'énergie d'activation de la réaction.",
                        ],
                    ),
                ],
            ),
        ],
    ),
    DemoStudent(
        email="demo.emma@nexus.test",
        first_name="Emma",
        username="emma_demo",
        track="ecg",
        plan_code="intermediate",
        lockers=[
            DemoLocker(
                name="Économie",
                color="#9d174d",
                courses=[
                    DemoCourse(
                        title="Le marché et la formation des prix",
                        paragraphs=[
                            "Sur un marché concurrentiel, le prix d'équilibre "
                            "égalise l'offre et la demande.",
                            "L'élasticité-prix mesure la sensibilité de la "
                            "demande à une variation du prix.",
                        ],
                    ),
                ],
            ),
            DemoLocker(
                name="Mathématiques appliquées",
                color="#1d4ed8",
                courses=[
                    DemoCourse(
                        title="Probabilités discrètes",
                        paragraphs=[
                            "Une variable aléatoire discrète prend un nombre "
                            "fini ou dénombrable de valeurs.",
                            "Son espérance est la moyenne de ses valeurs, "
                            "pondérée par leurs probabilités.",
                        ],
                    ),
                ],
            ),
            DemoLocker(name="Histoire-géographie", color="#475569"),
        ],
    ),
]

DEMO_EMAILS = [student.email for student in DEMO_STUDENTS]
