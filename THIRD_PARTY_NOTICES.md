# Third-party notices

The project's own code and documentation use the [MIT license](LICENSE).
Third-party material retains its own license; MIT does not replace those terms.

## Font Awesome Free icons

The previous/next SVG paths in `src/lib/ui/Carousel.svelte` are from Font Awesome
Free 7.3.1, copyright 2026 Fonticons, Inc. ([Font Awesome](https://fontawesome.com)).
They retain the source attribution comments and use
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Their presentation is adapted to the component: size, classes, styling and
accessibility attributes. Source: [Font Awesome Free license](https://github.com/FortAwesome/Font-Awesome/blob/7.x/LICENSE.txt).
Preserve this attribution when redistributing these icons, including in compiled
applications where HTML comments may be removed.

## Runtime dependencies

Dependency packages and their transitive dependencies retain their own notices
and licenses. This npm package ships this library's source, not copies of its
installed `node_modules`. If distributing a bundled application, preserve the
notices applicable to included dependencies.

| Direct dependency      | License / source                                                                |
| ---------------------- | ------------------------------------------------------------------------------- |
| `date-fns`             | [MIT](https://github.com/date-fns/date-fns/blob/main/LICENSE.md)                |
| `esm-env`              | [MIT](https://github.com/benmccann/esm-env/blob/main/LICENSE)                   |
| `marked`               | [MIT](https://github.com/markedjs/marked/blob/master/LICENSE.md)                |
| `isomorphic-dompurify` | [MIT](https://github.com/kkomelin/isomorphic-dompurify/blob/master/LICENSE)     |
| `gsap`                 | [GSAP Standard No Charge license](https://gsap.com/community/standard-license/) |

GSAP is used by Carousel under its own license. That license permits commercial
website/application usage but restricts certain competing visual animation
builders. It is not MIT. Consumers using GSAP must review those terms; consumers
importing unrelated components do not include GSAP in their application bundle.
