#import libraries
import json
import re
import nltk
import csv
import time
import pandas as pd 
import numpy as np
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.tag import StanfordNERTagger
from nltk.tokenize import word_tokenize
from textblob import TextBlob, blob
from textblob.blob import TextBlob


#open all parameter files
show_file = open('..\\Website\\Parameter\\show.txt', 'r', encoding="utf8", errors='ignore')
documents_file = open('..\\Website\\Parameter\\documents.txt', 'r', encoding="utf8", errors='ignore')
count_file = open('..\\Website\\Parameter\\count.txt', 'r', encoding="utf8", errors='ignore')
words_file = open('..\\Website\\Parameter\\words.txt', 'r', encoding="utf8", errors='ignore')
check_file = open('..\\Website\\Parameter\\chart.txt', 'r', encoding="utf8", errors='ignore')

#read parameter files
show = show_file.read()
documents = documents_file.read()
count = int(count_file.read())
words = words_file.read()
chartCheck = check_file.read()

#close parameter files
show_file.close()
documents_file.close()
count_file.close()
words_file.close()
check_file.close()



def loadDataCSV (): 
    #Reading CSV
    #Pfad bitte anpassen
    if documents == "[false, false, false, true]":
        data=pd.read_csv('..\\Website\\CSV\\213_machineIntelligence_suggestedDefs_AGISIsurvey.csv',encoding='cp1252')
        data=pd.read_csv('..\\Website\\CSV\\213_machineIntelligence_suggestedDefs_AGISIsurvey.csv',encoding='cp1252')
    elif documents == "[false, false, true, false]":
        data=pd.read_csv('..\\Website\\CSV\\125_humanIntelligence_suggestedDefs_AGISIsurvey.csv',encoding='cp1252')
    elif documents == "[false, false, true, true]":
        data=pd.read_csv('..\\Website\\CSV\\125_213.csv',encoding='utf8')
    elif documents == "[false, true, false, false]":
        data=pd.read_csv('..\\Website\\CSV\\71_DefsOfIntelligence_LeggHutter2007_extendedTable.csv',encoding='cp1252')
    elif documents == "[false, true, false, true]":
        data=pd.read_csv('..\\Website\\CSV\\71_213.csv',encoding='utf8')
    elif documents == "[false, true, true, false]":
        data=pd.read_csv('..\\Website\\CSV\\71_125.csv',encoding='utf8')
    elif documents == "[false, true, true, true]":
        data=pd.read_csv('..\\Website\\CSV\\71_125_213.csv',encoding='utf8')
    elif documents == "[true, false, false, false]":
        data=pd.read_csv('..\\Website\\CSV\\34_DefsOfIntelligence_AGISIsurvey.csv',encoding='cp1252')
    elif documents == "[true, false, false, true]":
        data=pd.read_csv('..\\Website\\CSV\\34_213.csv',encoding='utf8')
    elif documents == "[true, false, true, false]":
        data=pd.read_csv('..\\Website\\CSV\\34_125.csv',encoding='utf8')
    elif documents == "[true, false, true, true]":
        data=pd.read_csv('..\\Website\\CSV\\34_125_213.csv',encoding='utf8')
    elif documents == "[true, true, false, false]":
        data=pd.read_csv('..\\Website\\CSV\\34_71.csv',encoding='utf8')
    elif documents == "[true, true, false, true]":
        data=pd.read_csv('..\\Website\\CSV\\34_71_213.csv',encoding='utf8')
    elif documents == "[true, true, true, false]":
        data=pd.read_csv('..\\Website\\CSV\\34_71_125.csv',encoding='utf8')
    elif documents == "[true, true, true, true]":
        data=pd.read_csv('..\\Website\\CSV\\34_71_125_213.csv',encoding='utf8')
    #Save definitions in Array
    definitions = data['Definition'].values
    #Save Definitions in a array : deftext
    deftext=[]
    i=1
    for definition in definitions:
        deftext.append(definition)
        i=i+1
    return deftext

def main(deftext):

    nodes=[] #all nodes
    nodes_word_cluster=[] #the word cluster of the node (has the same position in the array as the node in the nodes array)
    nodes_quantity=[]#the quantity of the node (has the same position in the array as the node in the nodes array)
    source=[]#Source of Link
    target=[]#Target of Link
    combination=[] #word combination (two consecutive words from one definition)
    strength_combination= [] #quantity of combination (same position as source and target have in their array)

    filtered_sentence=[]#words in the definitions without stopwords in lower case
    word_cluster=[]#all word clusters
    
    #Contemplation of every single definition
    for definition in deftext:
        #remove Stopword and defining the word cluster
        sentences,cluster = removeStopWords(definition.lower())
        for word in sentences:
            filtered_sentence.append(word.lower())
        for word in cluster:
            word_cluster.append(word.lower())

    #Counting Quantity of nodes
    for data in filtered_sentence:
    #Word already in nodes Array   
        if data in nodes:
            data_index= nodes.index(data)
            #increase quantity
            nodes_quantity[data_index]=nodes_quantity[data_index]+1
    #Word is not in nodes array -> append word, quantity add cluster 
        else:
            nodes.append(data)
            nodes_quantity.append(1)   
            index = filtered_sentence.index(data)
            nodes_word_cluster.append(word_cluster[index])
    
    delete_list=[]
    for node in nodes:
        data_index = nodes.index(node)
        if words == "[false, false, false]":
            if(nodes_quantity[data_index]<count):
                delete_list.insert(0, data_index)
        elif words == "[false, false, true]":
            if(nodes_quantity[data_index]<count or ("jj" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        elif words == "[false, true, false]":
            if(nodes_quantity[data_index]<count or ("vb" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        elif words == "[false, true, true]":
            if(nodes_quantity[data_index]<count or ("vb" not in nodes_word_cluster[data_index].lower() and "jj" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        elif words == "[true, false, false]":
            if(nodes_quantity[data_index]<count or ("nn" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        elif words == "[true, false, true]":
            if(nodes_quantity[data_index]<count or ("nn" not in nodes_word_cluster[data_index].lower() and "jj" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        elif words == "[true, true, false]":
            if(nodes_quantity[data_index]<count or ("nn" not in nodes_word_cluster[data_index].lower() and "vb" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        elif words == "[true, true, true]":
            if(nodes_quantity[data_index]<count or ("vb" not in nodes_word_cluster[data_index].lower() and "jj" not in nodes_word_cluster[data_index].lower() and "nn" not in nodes_word_cluster[data_index].lower())):
                delete_list.insert(0, data_index)
        #select frequency of the twentieth most common node for checkbox "Show only 20 most common words"
        #compare_quantity = show20(nodes_quantity)
        #check for "20 most common words checkbox" frequency
        #if((show == "false" and chartCheck == "true") and (nodes_quantity[data_index] not in compare_quantity)):
         #   deleteNode(data_index) 
    
    for index in delete_list:
        del nodes[index]
        del nodes_quantity[index]
        del nodes_word_cluster[index]

    for definition in deftext:
        index=0
        print(definition)
        filtered_sentence, word_cluster= removeStopWords(definition.lower())
        for word in filtered_sentence:
            print(word)
            #find word combinations
            data= word.lower()
            if data in nodes:
                if (index<(filtered_sentence.__len__()-1)): #last word has no next word and is therefor out of range
                    nextWord=filtered_sentence[index+1]
                    if nextWord != data:
                        if nextWord in nodes:
                            p_combination= data+nextWord  #combining words
                            #combination already exists increase quantity
                            if(p_combination in combination):
                                p_combination_index= combination.index(p_combination)
                                strength_combination[p_combination_index]=strength_combination[p_combination_index]+1
                            else:
                                p_combination= nextWord+data 
                            #check combination in different order
                                if(p_combination in combination):
                                    p_combination_index= combination.index(p_combination)
                                    strength_combination[p_combination_index]=strength_combination[p_combination_index]+1
                                #if combination not exists add it 
                                else: 
                                    source.append(data)
                                    target.append(nextWord)
                                    combination.append(p_combination)
                                    strength_combination.append(1)
                    index = index+1 
     
    #-------------------------------------------------------
    #CREATING JSON
    #Pfad muss angepasst werden
    #Json file for graphs
    if (show):
        with open("..\\Website\\current.json", 'w') as outfile:
            json_data = {}
            json_data['nodes'] = []
            x=0
            #creating word entries
            for data in nodes:
                json_data['nodes'].append({  
                'word': nodes[x],
                'cluster': nodes_word_cluster[x],
                'quantity':nodes_quantity[x]  
                })
                x=x+1
            #creating link entries
            json_data['links'] = []
            x=0        
            for data in combination:
                json_data['links'].append({  
                'source': source[x].lower(),
                'target': target[x].lower(),
                'strength': strength_combination[x]  
                })
                x=x+1
            json.dump(json_data,outfile)
    else:
        #Json file for chart
        with open("..\\Website\\current.json", 'w') as outfile:
            json_data = []
            x=0
            #creating word entries
            for data in nodes:
                json_data.append({  
                'word': nodes[x],
                'cluster': nodes_word_cluster[x],
                'quantity':nodes_quantity[x]  
                })
                x=x+1       
            json.dump(json_data,outfile)

def show20 (nodes_quant):
    if(len(nodes_quant)>20):
        res = []
        sort_quant = sorted(nodes_quant, reverse=True)
        for i in range(0, 20): 
            res.append(sort_quant[i])
        return res
    else:
        return nodes_quant
           
def removeStopWords (definition):
    #replacing special signs
    definition = (" ".join(re.findall(r"[A-Za-z0-9]*", definition))).replace("  "," ")
    blob= TextBlob(definition)
    #REMOVING STOP WORDS
    #defining stop words
    stop_words= set(stopwords.words('english'))
    filtered_sentence=[] #words that are in the definitions
    word_cluster=[] #saving the word cluster for every word
    #check every word and identify word cluster
    for word, pos in blob.tags:
        
        #check if word in stop words 
        if word not in stop_words:
            #if not add stop word, add word and cluster to arrays 
            filtered_sentence.append(word)
            word_cluster.append(pos)
    return (filtered_sentence, word_cluster)

nltk.download('stopwords')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
deftext=loadDataCSV()
main(deftext)
