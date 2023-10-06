/* React page for the meal tracker */
import { Box, List, ListItem, Paper, InputLabel, MenuItem, FormControl, Select } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Navbar from "../../components/navbar/navbar";
import { Link } from "react-router-dom";
import { AuthContext } from "../../utils/authentication/auth-context";
import { useState, useEffect, useContext } from 'react';
import "./mealTracker.scss";
import axios from "axios";
import Stack from "@mui/material/Stack";
import Button from '@mui/material/Button';
import ROUTES from "../../routes";

/* Styles for page */
const useStyles = makeStyles((theme) => ({
    root: {
        color: "black",
    },
    selected: {
        color: "white"
    }
}));

/**
 * Returns a react component consisting of the meal tracker page. Includes all logic relevant to tracking meals.
 * 
 * @returns a react component consisting of the meal tracker page.
 */
const MealTracker = () => {
    /* Style object */
    const classes = useStyles();

    /* User's food items currently displayed in list */
    const [foodItems, setFoodItems] = useState([]);

    /* User from auth context */
    const { user } = useContext(AuthContext);
    const userId = user._id;

    /* Food info corresponding to input boxes */
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');
    const [carbohydrates, setCarbs] = useState('');
    const [servings, setServings] = useState('');

    /* Daily totals */
    const [totalCaloriesToday, setTotalCaloriesToday] = useState('');
    const [totalProteinToday, setTotalProteinToday] = useState('');
    const [totalCarbsToday, setTotalCarbsToday] = useState('');
    const [totalFatToday, setTotalFatToday] = useState('');

    /* Meal types */
    const EMPTY = 'Choose meal type';
    const BREAKFAST = 'Breakfast';
    const LUNCH = 'Lunch';
    const DINNER = 'Dinner';
    const SNACK = 'Snack';
    const [mealType, setMealType] = useState(EMPTY);

    /* Mapping of different error messages. */
    const ERROR_MESSAGES = {
        INCOMPLETE_FIELDS_ERROR: 'Please enter all necessary fields before saving',
        INVALID_CALORIES_ERROR: "Calories must be a number",
        INVALID_PROTEIN_ERROR: "Protein must be a number",
        INVALID_CARBS_ERROR: "Carbohydrates must be a number",
        INVALID_FAT_ERROR: "Fat must be a number",
        INVALID_SERVINGS_ERROR: "Servings must be a number"
    }

    const [errorMessage, setErrorMessage] = useState(ERROR_MESSAGES.INCOMPLETE_FIELDS_ERROR);
    const [allFieldsComplete, setAllFieldsComplete] = useState(true); /* initialize to true to hide error message */

    /* Load food items on page render */
    useEffect(() => {
        // Get food items on load
        const getFoodItems = async () => {
            try {
                const response = await axios.get(`users/allFoods/${userId}`, {
                    headers: { token: `Bearer ${user.accessToken}` }
                });
                setFoodItems(response.data);

                /* calculate total calories */
                let totalCalories = 0;
                response.data.forEach(item => totalCalories += item.calories * item.servings);
                setTotalCaloriesToday(totalCalories);

                /* calculate total protein */
                let totalProtein = 0;
                response.data.forEach(item => totalProtein += item.protein * item.servings);
                setTotalProteinToday(totalProtein);

                /* calculate total carbohydrates */
                let totalCarbs = 0;
                response.data.forEach(item => totalCarbs += item.carbohydrates * item.servings);
                setTotalCarbsToday(totalCarbs);

                /* calculate total fats */
                let totalFat = 0;
                response.data.forEach(item => totalFat += item.fat * item.servings);
                setTotalFatToday(totalFat);
            } catch (error) {
                console.log(error);
            }
        };

        getFoodItems(); /* note: removed only run on first render code */
        // eslint-disable-next-line
    }, []);

    /**
     * Checks if a value is a number and is greater than 0
     * 
     * @param {*} str arbitrary input value
     * @returns true if the value is valid according to the requirements
     */
    function isValidNumber(str) {
        const num = parseFloat(str);
        return !isNaN(num) && num >= 0 && str.trim() === num.toString();
    }

    const handleAddFood = async () => {
        /* initialize to true to hide error message */
        setAllFieldsComplete(true);

        /* check if all fields were entered */
        if (foodName === '' || calories === '' || protein === '' || carbohydrates === '' || servings === '' || mealType === EMPTY) {
            setAllFieldsComplete(false);
            setErrorMessage(ERROR_MESSAGES.INCOMPLETE_FIELDS_ERROR);
            return;
        }

        /* check if unit fields are numbers and >= 0 */
        if (!isValidNumber(calories)) {
            setAllFieldsComplete(false);
            setErrorMessage(ERROR_MESSAGES.INVALID_CALORIES_ERROR);
            return;
        }
        if (!isValidNumber(protein)) {
            setAllFieldsComplete(false);
            setErrorMessage(ERROR_MESSAGES.INVALID_PROTEIN_ERROR);
            return;
        }
        if (!isValidNumber(carbohydrates)) {
            setAllFieldsComplete(false);
            setErrorMessage(ERROR_MESSAGES.INVALID_CARBS_ERROR);
            return;
        }
        if (!isValidNumber(fat)) {
            setAllFieldsComplete(false);
            setErrorMessage(ERROR_MESSAGES.INVALID_FAT_ERROR);
            return;
        }
        if (!isValidNumber(servings)) {
            setAllFieldsComplete(false);
            setErrorMessage(ERROR_MESSAGES.INVALID_SERVINGS_ERROR);
            return;
        }

        try {
            const res = await axios.put(
                `users/addFood/${userId}`,
                { foodName, calories, fat, protein, carbohydrates, servings, mealType },
                { headers: { token: `Bearer ${user.accessToken}` } }
            );

            // Refresh the food items totals and the list after editing
            setFoodItems(res.data.foods);
            setTotalCaloriesToday(totalCaloriesToday + calories * servings);
            setTotalProteinToday(totalProteinToday + protein * servings);
            setTotalCarbsToday(totalCarbsToday + carbohydrates * servings);
            setTotalFatToday(totalFatToday + fat * servings);

            // Clear the editedNutritionFacts state
            setFoodName('');
            setCalories('');
            setProtein('');
            setFat('');
            setCarbs('');
            setServings('');
            setMealType(EMPTY);
        } catch (error) {
            console.error(error);
        }
    };

    /* Handles when user selects meal type */
    const handleMealTypeChange = (event) => {
        setMealType(event.target.value);
    }

    /* A list item in display */
    function listItem(item) { // display a menu item
        const name = item.foodName;
        const id = item.hash;

        return (
            <Link to={ROUTES.FOOD_ITEM_INFO.replace(":foodItemHash", id)} className="link" key={id}>
                <ListItem component="div" disablePadding>
                    <span className="listItem">{` ${name}`}</span>
                </ListItem>
            </Link>
        );
    }

    return (
        <div className="menu">
            <Navbar />
            <Stack className="stack" spacing={2} ml={"50px"} alignItems={"center"} justifyContent={"center"}>
            <div>
                
                <h4 className="sectionTitle">{"Foods You Ate Today"}</h4>
                <Box sx={{ width: '100%', maxHeight: 400, maxWidth: 360, bgcolor: 'background.paper', borderRadius: 5 }} className="list">
                    <Paper style={{ maxHeight: 400, overflow: 'auto' }}>
                        <List>
                            {
                                foodItems.length === 0 ?
                                    <ListItem component="div" disablePadding>
                                        <span className="listItem">{" You've eaten nothing today..."}</span>
                                    </ListItem>
                                    :
                                    foodItems.map((item) => listItem(item))
                            }
                        </List>
                    </Paper>
                </Box>
                <h4 className="sectionTitle">{"Total Daily Macronutrients"}</h4>
                <ListItem component="div" disablePadding style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Calories</span>
                    <span className="listItem">{totalCaloriesToday}</span>
                </ListItem>
                <ListItem component="div" disablePadding style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Protein</span>
                    <span className="listItem">{totalProteinToday}</span>
                </ListItem>
                <ListItem component="div" disablePadding style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Carbohydrates</span>
                    <span className="listItem">{totalCarbsToday}</span>
                </ListItem>
                <ListItem component="div" disablePadding style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fat</span>
                    <span className="listItem">{totalFatToday}</span>
                </ListItem>

            </div>
            </Stack>
            <Stack className="stack" spacing={2} ml={"50px"} alignItems={"center"} justifyContent={"center"}>
                <h4 className="sectionTitle">{"Add Meal Item To Tracker"}</h4>
                <div className="inputContainer">
                    <Box sx={{ minWidth: 230}} >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label htmlFor="foodName">Food Name</label>
                            <input id="foodName" type="text" value={foodName} className="inputBox" onChange={(e) => setFoodName(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label htmlFor="cals">Calories</label>
                            <input id="cals" type="text" value={calories} className="inputBox" onChange={(e) => setCalories(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label htmlFor="protein">Protein</label>
                            <input id="protein" type="text" value={protein} className="inputBox" onChange={(e) => setProtein(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label htmlFor="carbohydrates">{"Carbohydrates "}</label>
                            <input id="carbohydrates" type="text" value={carbohydrates} className="inputBox" onChange={(e) => setCarbs(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label htmlFor="fat">Fat</label>
                            <input id="fat" type="text" value={fat} className="inputBox" onChange={(e) => setFat(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label htmlFor="servings">Servings</label>
                            <input id="servings" type="text" value={servings} className="inputBox" onChange={(e) => setServings(e.target.value)} />
                        </div>
                    </Box>

                </div>
                <div className="mealTypeContainer">
                    <Box sx={{ width: 240 }}>
                        <FormControl error fullWidth sx={{ m: 1, width: 180 }}  >
                            <InputLabel>Meal Type</InputLabel>
                            <Select id="demo-simple-select" value={mealType} onChange={handleMealTypeChange} label="Filter" classes={{ root: classes.root, select: classes.selected }} >
                                <MenuItem value={EMPTY}>{EMPTY}</MenuItem>
                                <MenuItem value={BREAKFAST}>{BREAKFAST}</MenuItem>
                                <MenuItem value={LUNCH}>{LUNCH}</MenuItem>
                                <MenuItem value={DINNER}>{DINNER}</MenuItem>
                                <MenuItem value={SNACK}>{SNACK}</MenuItem>
                            </Select>
                            <Button variant="contained" color="success" size="large" className="button" onClick={handleAddFood}> Add Item </Button>
                        </FormControl>
                    </Box>
                </div>
                { // error message if not all fields filled in
                    <div className="errorMessage">
                        <p style={{ visibility: (allFieldsComplete) && "hidden" }}>
                            {errorMessage}
                        </p>
                    </div>
                }
            </Stack>
        </div>
    );

};

export default MealTracker;