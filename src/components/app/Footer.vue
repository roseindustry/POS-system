<script>
export default {
	data() {
		return {
			year: (new Date()).getFullYear()
		}
	}
}
</script>
<template>
	<!-- BEGIN #footer -->
	<div id="footer" class="app-footer">
		&copy; {{ year }} Rose Industry All Rights Reserved
	</div>
	<!-- END #footer -->
</template>
