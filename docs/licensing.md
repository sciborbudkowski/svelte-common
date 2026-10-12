# Licensing

[Documentation index](README.md) · [Project license](../LICENSE) · [Third-party notices](../THIRD_PARTY_NOTICES.md)

## Choice for this project

MIT is applied to svelte-common's own code and documentation, with copyright
2026 Scibor Budkowski. This was selected by the project owner. The package's
`license` field is MIT, and npm includes LICENSE and THIRD_PARTY_NOTICES.md.

MIT fits a reusable UI/services library whose goal is adoption: people can use it
in paid products and private applications, modify it, and redistribute it while
preserving the copyright and license notice. It includes a warranty/liability
disclaimer. It does not require their application or their modifications to become
open source, and does not impose payment or a visible attribution badge. See the
[MIT license summary](https://choosealicense.com/licenses/mit/) and
[authoritative license text](https://opensource.org/license/mit).

| License    | Main tradeoff for a reusable library                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| MIT        | Short, permissive terms with copyright/license retention; no explicit patent grant.                                                  |
| Apache-2.0 | Also permissive, with an explicit contributor patent grant, patent termination provisions and additional notice/change requirements. |
| GPL-3.0    | Strong copyleft for distributed covered works; requires evaluating how its terms apply to applications using the library.            |

Apache-2.0 is a good alternative when an explicit patent grant matters more than
minimal terms. GPL is a different policy choice when keeping distributed covered
works open is the priority. References: [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0),
[GPL-3.0](https://choosealicense.com/licenses/gpl-3.0/).

## Third-party material

MIT applies to the project's own material. Dependencies and copied assets retain
their licenses. Carousel includes Font Awesome Free SVG paths under CC BY 4.0;
these are identified in the packaged third-party notices. Preserve that attribution
in redistributions even when a production compiler removes HTML comments.

GSAP uses its own Standard No Charge license, not MIT. Its current terms allow
commercial website/app use and restrict certain competing visual animation builder
uses. That affects consumers who include GSAP, independently of this project's MIT
license. See the [GSAP license](https://gsap.com/community/standard-license/).
Other direct runtime dependencies declare MIT; transitive packages retain their
own notices. This documentation is not a comprehensive audit of every dependency.

## Maintenance

Keep LICENSE at the repository root and its SPDX identifier in package.json.
Contributions should be accepted under the project's license, without changing the
license of copied third-party material. Preserve source notices and extend
THIRD_PARTY_NOTICES.md when adding assets. Review dependency license changes when
upgrading. A public repository without an explicit license does not provide the
same reuse permissions as an MIT-licensed repository; see
[GitHub's licensing guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
