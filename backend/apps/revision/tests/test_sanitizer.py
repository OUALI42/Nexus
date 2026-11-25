import pytest

from apps.revision.sanitizer import sanitize_sheet_html

DANGEROUS_FRAGMENTS = (
    "<script",
    "onerror",
    "onclick",
    "onload",
    "javascript:",
    "data:",
    "<iframe",
    "<img",
    "<svg",
    "<style",
    "style=",
    "<form",
)


@pytest.mark.parametrize(
    "payload",
    [
        "<script>alert(1)</script><p>ok</p>",
        "<img src=x onerror=alert(1)>",
        '<p onclick="alert(1)">Clique</p>',
        '<a href="javascript:alert(1)">Lien</a>',
        '<a href="jav&#x09;ascript:alert(1)">Lien encodé</a>',
        '<a href="data:text/html,<script>alert(1)</script>">Lien data</a>',
        '<svg onload="alert(1)"><circle /></svg>',
        '<iframe src="https://pirate.example"></iframe>',
        '<p style="position:fixed;inset:0">Faux écran</p>',
        "<style>body { display: none }</style>",
        '<form action="https://pirate.example"><input name="password"></form>',
    ],
)
def test_dangerous_html_is_neutralised(payload):
    result = sanitize_sheet_html(payload).lower()

    for fragment in DANGEROUS_FRAGMENTS:
        assert fragment not in result


def test_the_editor_formatting_is_kept_as_is():
    html = (
        "<h2>Suites</h2>"
        "<p><strong>Définition</strong> : une suite <em>converge</em> si…</p>"
        "<ul><li>bornée</li><li>monotone</li></ul>"
        "<blockquote>Théorème de la limite monotone</blockquote>"
    )

    assert sanitize_sheet_html(html) == html


def test_a_safe_link_is_kept_and_isolated():
    result = sanitize_sheet_html('<a href="https://fr.wikipedia.org">Wikipédia</a>')

    assert 'href="https://fr.wikipedia.org"' in result
    assert 'rel="noopener noreferrer nofollow"' in result


def test_a_main_title_loses_its_tag_but_keeps_its_text():
    result = sanitize_sheet_html("<h1>Suites</h1>")

    assert "<h1" not in result
    assert "Suites" in result


def test_maths_symbols_are_escaped_not_removed():
    assert sanitize_sheet_html("<p>x < 3 et y > 2</p>") == "<p>x &lt; 3 et y &gt; 2</p>"


def test_comments_are_removed():
    assert sanitize_sheet_html("<p>a</p><!-- secret -->") == "<p>a</p>"
