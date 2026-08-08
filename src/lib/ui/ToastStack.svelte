<script lang="ts">
    import { dismissToast, getVisibleToasts } from '$lib/stores/toaststack.svelte';
    import { fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { cubicOut } from 'svelte/easing';
    import type { UIToastType } from '$lib/stores/toaststack.svelte';

    import CircularTimer from './CircularTimer.svelte';

    let lastToastId: string[] = [];
    let initialized = false;

    const SWIPE_THRESHOLD = 40;

    function handlePointerDown(event: PointerEvent, id: string) {
        const target = event.target as HTMLElement | null;
        if(target?.closest('button, a, input, textarea, select, [role="button"]')) return;

        const startY = event.clientY;
        const currentTarget = event.currentTarget as HTMLElement;
        currentTarget.setPointerCapture(event.pointerId);

        const onMove = (e: PointerEvent) => {
            const deltaY = e.clientY - startY;
            if(deltaY < -SWIPE_THRESHOLD) {
                cleanup();
                dismissToast(id);
            }
        };

        const onUp = () => cleanup();

        const cleanup = () => {
            currentTarget.releasePointerCapture(event.pointerId);
            currentTarget.removeEventListener('pointermove', onMove);
            currentTarget.removeEventListener('pointerup', onUp);
            currentTarget.removeEventListener('pointercancel', onUp);
        }

        currentTarget.addEventListener('pointermove', onMove);
        currentTarget.addEventListener('pointerup', onUp);
        currentTarget.addEventListener('pointercancel', onUp);
    }

    function getIcon(forType: UIToastType): string {
        switch(forType) {
            case 'success': return 'bi bi-check-circle-fill';
            case 'error': return 'bi bi-exclamation-circle-fill';
            case 'warning': return 'bi bi-exclamation-circle-fill';
            case 'info': return 'bi bi-info-circle-fill';
            case 'neutral': return 'bi bi-arrow-right-circle-fill';
        }
    }

    $effect(() => {
        const visible = getVisibleToasts();
        const ids = visible.map((t) => t.id);
        const newestId = ids[0] ?? null;

        if(!initialized) {
            initialized = true;
            lastToastId = ids;
            return;
        }

        lastToastId = ids;
    });
</script>

<div class="toast-stack" aria-live="polite" aria-relevant="additions removals">
    {#each getVisibleToasts() as t (t.id)}
        <div
            class={`toast ${t.type}`}
            in:fly={{ y: 8, duration: 150, easing: cubicOut }}
            out:fly={{ y: -8, duration: 125, easing: cubicOut }}
            animate:flip={{ duration: 200, easing: cubicOut }}
            onpointerdown={(e) => handlePointerDown(e, t.id)}
            role="status"
        >
            <div class="icon">
                {#if t.icon}
                    <span>{t.icon}</span>
                {:else}
                    <i class={getIcon(t.type)}></i>
                {/if}
            </div>
            <div class="content">
                <div class="title">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html t.title ?? ''}
                </div>
                {#if t.message}
                    <div class="message">
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        {@html t.message}
                    </div>
                {/if}
            </div>
            <div class="x">
                {#if t.autoClose}
                    <div class="timer-ring">
                        <CircularTimer onTimeout={() => dismissToast(t.id)} duration={t.duration} size="sm" />
                    </div>
                {/if}
                <button type="button" class="close" aria-label="Zamknij" onclick={() => dismissToast(t.id)}>
                    <i class="fa-solid fa-xmark fa-fw"></i>
                </button>
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .toast-stack {
        position: fixed;
        z-index: 10999;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: min(20rem, calc(100vw - 2rem));
        gap: .5rem;
        left: 50%;
        bottom: calc(var(--bottom-bar-height) + 1rem);
        transform: translateX(-50%);
        pointer-events: none;

        .toast {
            border-radius: var(--br);
            pointer-events: auto;
            display: flex;
            flex-direction: row;
            padding: .5rem;
            gap: .5rem;
            align-items: center;
            position: relative;
            overflow: hidden;
            width: 100%;
            min-width: 0;
            box-shadow: var(--shadow-4);
            pointer-events: auto;

            &.error {
                color: rgb(var(--clr-white-rgb));
                background-color: rgb(var(--clr-red-rgb));
            }
            &.warning {
                background-color: rgb(var(--clr-yellow-rgb));
            }
            &.success {
                background-color: rgb(var(--clr-green-rgb));
            }
            &.info {
                background-color: rgb(var(--clr-blue-rgb));
            }
            &.neutral {
                background-color: rgb(var(--clr-lightgray-rgb));
            }

            &.warning, &.success, &.info, &.neutral {
                color: rgb(var(--clr-black-rgb));
            }

            .icon {
                display: flex;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;

                i {
                    font-size: 1.75rem;
                }
            }

            .content {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                min-width: 0;

                .title {
                    font-size: 1rem;
                    font-weight: 600;
                }
                .message {
                    font-size: .75rem;
                    font-weight: 400;
                }
            }

            .x {
                position: relative;
                display: grid;
                place-items: center;
                flex-shrink: 0;
                width: 30px;
                height: 30px;

                .timer-ring {
                    position: absolute;
                    inset: 0;
                    display: grid;
                    place-items: center;
                    pointer-events: none;
                }

                button {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    padding: 0;
                    color: inherit;
                    background: transparent;
                    border: none;
                    line-height: 1;

                    i {
                        display: block;
                        line-height: 1;
                    }
                }
            }
        }
    }
</style>