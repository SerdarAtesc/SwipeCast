pragma solidity ^0.8.19;

contract GameScoreContract {
    // Struct to represent an app's score data
    struct AppScore {
        string id;           // App UUID as string
        uint256 score;       // Score as uint256 (0 to 2^256-1)
        uint256 updatedAt;   // Timestamp when last updated
    }
    
    // Mapping from app ID to AppScore
    mapping(string => AppScore) public appScores;
    
    // Array to keep track of all app IDs for sorting
    string[] public appIds;
    
    // Mapping to check if an app ID exists
    mapping(string => bool) public appExists;
    
    // Events
    event ScoreIncremented(string indexed appId, uint256 newScore, uint256 timestamp);
    event AppAdded(string indexed appId, uint256 initialScore, uint256 timestamp);
    
    /**
     * @dev Increment score for an app. If app doesn't exist, create new entry with score 1
     * @param _id App's UUID as string
     */
    function incrementScore(string memory _id) public {
        require(bytes(_id).length > 0, "App ID cannot be empty");
        
        if (appExists[_id]) {
            // App exists, increment score
            appScores[_id].score += 1;
            appScores[_id].updatedAt = block.timestamp;
            emit ScoreIncremented(_id, appScores[_id].score, block.timestamp);
        } else {
            // App doesn't exist, create new entry
            appScores[_id] = AppScore({
                id: _id,
                score: 1,
                updatedAt: block.timestamp
            });
            appIds.push(_id);
            appExists[_id] = true;
            emit AppAdded(_id, 1, block.timestamp);
        }
    }
    
    /**
     * @dev Get all apps sorted by score in descending order
     * @return sortedApps Array of AppScore structs sorted by score desc
     */
    function getAllAppsSortedByScore() public view returns (AppScore[] memory sortedApps) {
        uint256 appCount = appIds.length;
        sortedApps = new AppScore[](appCount);
        
        // Copy all apps to the result array
        for (uint256 i = 0; i < appCount; i++) {
            sortedApps[i] = appScores[appIds[i]];
        }
        
        // Sort by score in descending order (bubble sort for simplicity)
        for (uint256 i = 0; i < appCount - 1; i++) {
            for (uint256 j = 0; j < appCount - i - 1; j++) {
                if (sortedApps[j].score < sortedApps[j + 1].score) {
                    AppScore memory temp = sortedApps[j];
                    sortedApps[j] = sortedApps[j + 1];
                    sortedApps[j + 1] = temp;
                }
            }
        }
        
        return sortedApps;
    }
    
}