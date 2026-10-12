/** Keep the property and boolean attribute aligned, including hosts without native reflection. */
export function syncInert(node: HTMLElement, initial: boolean) {
	function update(value: boolean) {
		node.inert = value;
		if (value) node.setAttribute('inert', '');
		else node.removeAttribute('inert');
	}
	update(initial);
	return { update };
}
