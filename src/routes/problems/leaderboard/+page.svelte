<script lang="js">
	import { DataTable, Pagination } from "carbon-components-svelte";
	import { getProblemLeaderboard } from "$lib/supabase";

	let loaded = false;
	let pageSize = 100;
	let page = 1; // 1-indexed
	let rows = [];

	(async () => {
		rows = await getProblemLeaderboard();
		console.log(rows)
		loaded = true;
	})();
	
</script>

<br />
<h1>Problem Leaderboard</h1>
{#if !loaded}
	<p>Loading leaderboard...</p>
{:else}
	<DataTable
		sortable
		size="medium"
		sortKey="all_unpublished_count"
		sortDirection="descending"
		headers={[
			{ key: "full_name", value: "PW Name" },
			{ key: "endorsed_count", value: "Endorsed" },
			{ key: "all_unpublished_count", value: "All Unpublished" },
			{ key: "in_progress_count", value: "In Progress (draft or idea)" },
		]}
		rows={
			rows
		}
		pageSize={pageSize}
		page={page}
	>
		<svelte:fragment slot="cell" let:cell>
			<div>
				<div style="overflow: hidden;">
					{cell.value == null || cell.value == "" ? "None" : cell.value}
				</div>
			</div>
		</svelte:fragment>
	</DataTable>
	<Pagination
		class="datatable"
		bind:pageSize
		bind:page
		totalItems={rows.length}
		pageSizeInputDisabled
	/>

{/if}



<style>
</style>
