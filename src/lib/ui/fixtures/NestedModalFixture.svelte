<script lang="ts">
	import Modal from '../Modal.svelte';
</script>

<Modal id="first" ariaLabel="Outer" {content} />
{#snippet content()}
	<Modal id="nested" ariaLabel="Nested" />
{/snippet}
