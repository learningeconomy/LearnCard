# BoostCountBoostsRequest

## Properties

| Name      | Type                                                                | Description | Notes      |
| --------- | ------------------------------------------------------------------- | ----------- | ---------- |
| **query** | [**BoostCountBoostsRequestQuery**](BoostCountBoostsRequestQuery.md) |             | [optional] |

## Example

```python
from openapi_client.models.boost_count_boosts_request import BoostCountBoostsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCountBoostsRequest from a JSON string
boost_count_boosts_request_instance = BoostCountBoostsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCountBoostsRequest.to_json())

# convert the object into a dict
boost_count_boosts_request_dict = boost_count_boosts_request_instance.to_dict()
# create an instance of BoostCountBoostsRequest from a dict
boost_count_boosts_request_from_dict = BoostCountBoostsRequest.from_dict(boost_count_boosts_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
