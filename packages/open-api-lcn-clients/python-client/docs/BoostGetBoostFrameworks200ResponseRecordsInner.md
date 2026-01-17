# BoostGetBoostFrameworks200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**source_uri** | **str** |  | [optional] 
**status** | **str** |  | [default to 'active']
**created_at** | **str** |  | [optional] 
**updated_at** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_frameworks200_response_records_inner import BoostGetBoostFrameworks200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostFrameworks200ResponseRecordsInner from a JSON string
boost_get_boost_frameworks200_response_records_inner_instance = BoostGetBoostFrameworks200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostFrameworks200ResponseRecordsInner.to_json())

# convert the object into a dict
boost_get_boost_frameworks200_response_records_inner_dict = boost_get_boost_frameworks200_response_records_inner_instance.to_dict()
# create an instance of BoostGetBoostFrameworks200ResponseRecordsInner from a dict
boost_get_boost_frameworks200_response_records_inner_from_dict = BoostGetBoostFrameworks200ResponseRecordsInner.from_dict(boost_get_boost_frameworks200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


