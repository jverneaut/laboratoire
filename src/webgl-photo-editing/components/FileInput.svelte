<script>
  import { onMount } from 'svelte';

  import {
    image as storeImage,
    brightness,
    highlights,
    shadows,
    contrast,
    saturation,
    grain,
  } from '../store';
  import defaults from '../store/defaults';

  import defaultImage from '../img/lena.jpg';

  onMount(() => {
    const image = document.createElement('img');
    image.onload = () => {
      $storeImage = image;
    };
    image.src = defaultImage;
  });

  const onChange = e => {
    $storeImage = null;

    $brightness = defaults.brightness;
    $highlights = defaults.highlights;
    $shadows = defaults.shadows;
    $contrast = defaults.contrast;
    $saturation = defaults.saturation;
    $grain = defaults.grain;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = e => {
      const image = new Image();
      image.onload = e => {
        $storeImage = image;
      };
      image.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };
</script>

<input type="file" id="input" on:change={onChange} />
