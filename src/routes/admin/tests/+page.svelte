<script>
	import toast from "svelte-french-toast";
	import Button from "$lib/components/Button.svelte";
	import TestList from "$lib/components/TestList.svelte";
	import { handleError } from "$lib/handleError.ts";
	import { getAllTests,
		getAllTournaments, 
		getTestInfo,
		getTestProblemsByTestId,
		getProblem,
		getImageURL,
	} from "$lib/supabase";
	import { json } from "@sveltejs/kit";

	let tournaments = {};
	let tests = [];
	let testsArchived = [];
	let loading = true;
	let selectedTests = [];
	console.log("INIT");

	async function getTests() {
		try {
			console.log("GETTING TESTS");
			let testList = await getAllTests("*,tournaments(tournament_name)");
			console.log("GOT TESTS");
			for (let test of testList) {
				tournaments[test.tournament_id].push(test);

				if (test.archived) testsArchived.push(test);
				else tests.push(test);
			}
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	async function getTournaments() {
		try {
			console.log("GETTING TOURN");
			let tournamentList = await getAllTournaments();
			console.log("GOT TOURN");
			for (let tournament of tournamentList) {
				tournaments[tournament.id] = [tournament.tournament_name];
			}
			getTests();
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	async function handleDownload(selectedTestIds) {
		if (selectedTestIds.length === 0) {
			toast.error("No tests selected!");
			return;
		}
		console.log("Downloading tests with IDs:", selectedTestIds);
		let jsonFile = {
			tests: [],
			test_problems: [],
			problem_images: [],
			problems: [],
		};
		for (let testId of selectedTestIds) {
			// Get test info
			let testInfo = await getTestInfo(testId);
			
			// Get test problems
			let testProblems = await getTestProblemsByTestId(testId);

			// Get problems
			for (let testProblem of testProblems) {
				let problem = await getProblem(testProblem.problem_id);

				// Push each individual problem and test_problem to json file
				jsonFile.problems.push(problem);
				jsonFile.test_problems.push(testProblem);

				// Look through problem_latex for images
				const matches = [...problem.problem_latex?.matchAll(/\\image\{([^\\}]+)\}/g)];
				const imageMatches = matches.map((match) => ({
					fullMatch: match[0],
					imageName: match[1],
				}));
				console.log("IMAGE MATCHES", imageMatches);
				for (let imageMatch of imageMatches) {
					let imageURL = await getImageURL(imageMatch.imageName);
					if (!jsonFile.problem_images.includes(imageURL)) {
						jsonFile.problem_images.push(imageURL);
					}
				}
			}
			jsonFile.tests.push(testInfo);
		}
		const blob = new Blob([JSON.stringify(jsonFile, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "tests.json";
		a.click();
		URL.revokeObjectURL(url);
	}

	getTournaments();
</script>

<br />
<h1>Admin: View Tests</h1>
<p><i>For editing test coordinators</i></p>
<br />

{#if loading}
	Loading up tests...
{:else}
	<Button href="/admin/tests/new" title="Create New Test" />
	<Button
		title="Download Selected Tests"
		action={() => handleDownload(selectedTests)}
	/>
	<div style="padding: 10px; margin-left: auto; margin-right: auto;">
		<TestList {tests} selectable={true} bind:selectedItems={selectedTests}/>
	</div>
	<br />
	<h2>Archived Tests</h2>
	<div style="padding: 10px; margin-left: auto; margin-right: auto;">
		<TestList tests={testsArchived} selectable={true} bind:selectedItems={selectedTests}/>
	</div>
{/if}
