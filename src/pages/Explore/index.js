import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { MdLocationPin } from "react-icons/md";
import { ProgressBar } from "react-loader-spinner";
import ReusableInput from "../../utils/ReusableInput";
import ReusableButton from "../../utils/ReusableButton";
import EachRestaurantCard from "../../components/EachRestaurantCard";
import Shimmer from "../../components/Shimmer";
import Footer from "../../components/Footer";
import useDeviceCheck from "../../utils/useDeviceCheck";
import useGeoLocations from "../../utils/useGeoLocations";
import {
  ALL_RESTAURANTS_API_URL_DESKTOP,
  ALL_RESTAURANTS_API_URL_MOBILE,
} from "../../config/Constants";

const constApiStatus = {
  initial: "INITIAL",
  inProgress: "IN_PROGRESS",
  success: "SUCCESS",
  failure: "FAILURE",
};

const Explore = () => {
  const storedData = JSON.parse(sessionStorage.getItem("exploreData"));
  const [cityName, setCityName] = useState(
    storedData !== null ? storedData.apiStaus.cityName : ""
  );
  const [isSearchEmpty, setSearchEmpty] = useState(false);
  const [searchClicked, setSearchClicked] = useState(
    storedData !== null ? storedData.searchClicked : false
  );
  const [apiStaus, setApiStatus] = useState(
    storedData !== null
      ? storedData.apiStaus
      : {
          status: constApiStatus.initial,
          errorMsg: "",
          cityName: "",
          data: [],
        }
  );

  const getGeoLocation = useGeoLocations(
    cityName,
    setSearchEmpty,
    setApiStatus,
    constApiStatus
  );

  useEffect(() => {
    storeData();
  }, []);

  const [geoLactions, setGeoLocations] = useState(
    storedData
      ? storedData.geoLactions
      : {
          lat: "",
          lon: "",
        }
  );

  const storeData = () => {
    sessionStorage.setItem(
      "exploreData",
      JSON.stringify({
        apiStaus,
        searchClicked,
        geoLactions,
      })
    );
  };

  const isMobile = useDeviceCheck();
  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, [geoLactions]);

  const onClickSearch = async () => {
    if (cityName === "") {
      setSearchClicked(false);
      setSearchEmpty(true);
    } else {
      setSearchClicked(true);
      setSearchEmpty(false);
      const result = await getGeoLocation();
      setGeoLocations(result);
    }
  };

  const getData = async () => {
    const { lat, lon } = geoLactions;
    if (lat === "" && lon === "") {
      if (searchClicked) {
        setApiStatus((prev) => ({
          ...prev,
          status: constApiStatus.inProgress,
        }));
      } else {
        setApiStatus((prev) => ({
          ...prev,
          status: constApiStatus.initial,
        }));
      }
    } else {
      try {
        setApiStatus((prev) => ({
          ...prev,
          status: constApiStatus.inProgress,
        }));
        let apiUrl = "";
        apiUrl = isMobile
          ? ALL_RESTAURANTS_API_URL_MOBILE.replace(
              "lat=dummy1&lng=dummy2",
              `lat=${lat}&lng=${lon}`
            )
          : ALL_RESTAURANTS_API_URL_DESKTOP.replace(
              "lat=dummy1&lng=dummy2",
              `lat=${lat}&lng=${lon}`
            );
        const response = await fetch(apiUrl);
        if (response.ok === true) {
          const data = await response.json();
          if (isMobile) {
            if (
              data?.data?.success?.cards[4]?.gridWidget?.gridElements
                ?.infoWithStyle?.restaurants
            ) {
              setApiStatus((prev) => ({
                ...prev,
                data: data?.data?.success?.cards[4]?.gridWidget?.gridElements
                  ?.infoWithStyle?.restaurants,
                cityName: cityName,
                status: constApiStatus.success,
              }));
            } else {
              setApiStatus((prev) => ({
                ...prev,
                data: data?.data?.success?.cards[1]?.gridWidget?.gridElements
                  ?.infoWithStyle?.restaurants,
                cityName: cityName,
                status: constApiStatus.success,
              }));
            }
          } else {
            if (
              data?.data?.cards[2]?.card?.card?.gridElements?.infoWithStyle
                ?.restaurants
            ) {
              setApiStatus((prev) => ({
                ...prev,
                data: data?.data?.cards[2]?.card?.card?.gridElements
                  ?.infoWithStyle?.restaurants,
                cityName: cityName,
                status: constApiStatus.success,
              }));
            } else {
              setApiStatus((prev) => ({
                ...prev,
                data: data?.data?.cards[1]?.card?.card?.gridElements
                  ?.infoWithStyle?.restaurants,
                cityName: cityName,
                status: constApiStatus.success,
              }));
            }
          }
        } else {
          setApiStatus((prev) => ({
            ...prev,
            status: constApiStatus.failure,
            errorMsg: "Please Check Your City Name Once",
          }));
        }
      } catch (error) {
        setApiStatus((prev) => ({
          ...prev,
          status: constApiStatus.failure,
          errorMsg:
            "Something Got an Error Please Refresh The Page And Try Again",
        }));
      }
    }
  };

  const SuccessView = () => (
    <>
      {apiStaus?.data?.length > 0 ? (
        <ul className="p-0 flex flex-col items-center justify-center sm:flex-row sm:flex-wrap w-full space-y-3">
          <li></li>
          {apiStaus?.data?.map((each) => (
            <EachRestaurantCard
              key={each.info.id}
              restaurantList={each?.info}
            />
          ))}
        </ul>
      ) : (
        <div className="h-full flex flex-col justify-center items-center">
          <p className="text-xl font-bold">
            🥺 Sorry, Delivery is Not Available in your city
          </p>
        </div>
      )}
    </>
  );

  const FailureView = () => (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <h1>Failure View</h1>
      <p>{apiStaus.errorMsg}</p>
    </div>
  );

  const RenderResults = () => {
    switch (apiStaus.status) {
      case constApiStatus.inProgress:
        return <Shimmer />;
      case constApiStatus.success:
        return <SuccessView />;
      case constApiStatus.failure:
        return <FailureView />;
      default:
        return null;
    }
  };

  return (
    <div className="p-2 h-[85%] sm:px-3 md:px-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <div
          className={`search-city flex items-center border border-black w-fit self-center sm:self-start rounded-md ${
            isSearchEmpty ? "border-red-600 border-2" : null
          }`}
        >
          <ReusableInput
            type="search"
            className="p-1 pb-2 w-full max-w-[250px]"
            placeholder="Enter A City Name"
            onChange={(e) => {
              const newCityName = e.target.value;
              setCityName(newCityName);
            }}
            onKeyDown={(e) => (e.key === "Enter" ? onClickSearch() : null)}
            value={cityName}
          />
          <ReusableButton
            value={<FaSearch />}
            className={`h-10 border flex flex-col items-center justify-center border-black border-r-0 border-b-0 border-t-0 hover:bg-blue-300 ${
              isSearchEmpty ? "border-red-600 border-2" : null
            }`}
            onClick={onClickSearch}
          />
        </div>
        {apiStaus?.status === constApiStatus?.success ? (
          <p className="text-center sm:m-auto flex items-center justify-center my-2 font-bold capitalize">
            <MdLocationPin />
            {apiStaus.cityName}
          </p>
        ) : apiStaus?.status === constApiStatus?.inProgress ? (
          <p className="text-center sm:mx-auto flex items-center justify-center">
            <ProgressBar
              height="40"
              width="150"
              borderColor="#F4442E"
              barColor="#51E5FF"
            />
          </p>
        ) : null}
      </div>
      <div className="main-body h-full w-full flex flex-col mt-4">
        <div className="mb-4">{RenderResults()}</div>
        <div className="border flex flex-col h-[5%] items-center justify-center mt-auto w-full">
          <Footer />
        </div>
      </div>
    </div>
  );
};
export default Explore;
