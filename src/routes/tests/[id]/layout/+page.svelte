<script lang="ts">
	import { page } from "$app/stores";
	import { Loading } from "carbon-components-svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import {
		getTestInfo,
		getTestProblems,
		getThisUser,
		getThisUserRole,
		upsertTestAnswerBoxes,
	} from "$lib/supabase";
	import compilerPath from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
	import rendererPath from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";
	import testSheet from "./test_sheet.typ?url";
	import TypstEditor from "$lib/components/TypstEditor.svelte";
	import { supabase } from "$lib/supabaseClient";

	let testId = Number($page.params.id);
	let test;
	let testCoordinators = [];
	let loading = true;
	let problems = [];
	let userIsTestCoordinator = false;
	let template_body = null;

	async function getTest() {
		try {
			test = await getTestInfo(
				testId,
				"*,test_coordinators(users(*)),tournaments(tournament_name,tournament_date),testsolves(test_id,id)"
			);
			testCoordinators = test.test_coordinators.map((x: any) => x.users);
			userIsTestCoordinator =
				!!testCoordinators.find(
					async (tc) => tc.id === (await getThisUser()).id
				) || (await getThisUserRole()) >= 40;
			await getProblems();
			template_body =
				test.print_layout ?? (await fetch(testSheet).then((r) => r.text()));
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	//Look a comment
	async function getProblems() {
		try {
			let problemList = await getTestProblems(testId);

			problems = problemList.map((pb: any) => ({
				problem_number: pb.problem_number,
				...pb.full_problems,
			}));
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	getTest();
</script>

<br />
{#if loading}
	<Loading />
{:else if !userIsTestCoordinator}
	<p>No page access.</p>
{:else}
	<div>
		<h1>Test: {test.test_name}</h1>
		<p><strong>Tournament:</strong> {test.tournaments.tournament_name}</p>
		<p><strong>Description:</strong> {test.test_description}</p>
		<br />
		<TypstEditor
			on_template_save={async (template) => {
				const { error } = await supabase
					.from("tests")
					.update({ print_layout: template })
					.eq("id", testId);
				if (error) {
					console.error(error.message);
					toast.error(error.message);
				} else {
					toast.success("Updated database.");
				}
			}}
			on_answer_position_update={async (positions) => {
				try {
					await upsertTestAnswerBoxes(test.id, positions);
					toast.success("Saved answer positions.");
				} catch (e) {
					handleError(e);
					toast.error(e.message);
				}
			}}
			{rendererPath}
			{compilerPath}
			initial_text={template_body}
			{test}
			{problems}
		/>
	</div>
{/if}
<br />
