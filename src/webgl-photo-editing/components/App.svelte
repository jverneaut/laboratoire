<script>
  import Preview from './Preview.svelte';
  import Sidebar from './Sidebar.svelte';
  import FileInput from './FileInput.svelte';

  import { brightness, highlights, shadows, contrast, saturation, grain } from '../store';
</script>

<main>
  <Preview />

  <Sidebar>
    <FileInput />

    <h1>Brightness</h1>
    <input type="range" bind:value={$brightness} min="-0.5" max="0.5" step="0.001" />

    <h1>Highlights</h1>
    <input type="range" bind:value={$highlights} min="0.0" max="2.0" step="0.001" />

    <h1>Shadows</h1>
    <input type="range" bind:value={$shadows} min="0.0" max="2.0" step="0.001" />

    <h1>Contrast</h1>
    <input type="range" bind:value={$contrast} min="0.0" max="2.0" step="0.001" />

    <h1>Saturation</h1>
    <input type="range" bind:value={$saturation} min="0.0" max="2.0" step="0.001" />

    <h1>Grain</h1>
    <input type="range" bind:value={$grain} min="0.0" max="1.0" step="0.001" />
  </Sidebar>
</main>
