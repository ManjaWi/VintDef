#!/usr/bin/env python3
#import libraries
import json
import re
import nltk
import csv
import time
import pandas as pd 
#import numpy as np
import os
import sys
from nltk.corpus import stopwords
from nltk.tag import StanfordNERTagger
from nltk.tokenize import word_tokenize
#from textblob import TextBlob, blob
from textblob.blob import TextBlob


high_path = os.path.abspath(".")


#read parameters

show = sys.argv[2]
documents = sys.argv[3]
count = int(sys.argv[4])
words = sys.argv[5]
chartCheck = sys.argv[2]

#read parameters for debug (real parameters must be commented out)
'''
show = "true"
chartCheck = "false"
documents = "true,true,true,true"
count = 6
words = "false,false,false"
'''

def loadDataCSV (): 
    #Reading CSV
    #Pfad bitte anpassen
    
    docu = documents.split(',')
    data = pd.DataFrame()
    
    if docu[0]=='true':
        data = pd.concat([pd.read_csv(high_path+'\\CSV\\34_DefsOfIntelligence_AGISIsurvey.csv',encoding='cp1252')])
    if docu[1]=='true':
        data = pd.concat([data,pd.read_csv(high_path+'\\CSV\\71_DefsOfIntelligence_LeggHutter2007_extendedTable.csv',encoding='cp1252')])
    if docu[2]=='true':
        data = pd.concat([data,pd.read_csv(high_path+'\\CSV\\125_humanIntelligence_suggestedDefs_AGISIsurvey.csv',encoding='cp1252')])
    if docu[3]=='true':
        data = pd.concat([data,pd.read_csv(high_path+'\\CSV\\213_machineIntelligence_suggestedDefs_AGISIsurvey.csv',encoding='cp1252')])
    
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
    all_filtered_sentence =[]

    #Contemplation of every single definition
    for definition in deftext:
        #remove Stopword and defining the word cluster
        
        sentences,cluster = removeStopWords(definition.lower())
        
        #for word in sentences:
        filtered_sentence.extend(sentences)
        all_filtered_sentence.append(sentences)
        
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
    
    data_index=0
    while data_index<len(nodes):
        if nodes_quantity[data_index]<count or (nodes_word_cluster[data_index].lower() not in words and len(words)>0):
            del nodes[data_index]
            del nodes_quantity[data_index]
            del nodes_word_cluster[data_index]
            data_index -= 1
        data_index += 1
    
#select frequency of the twentieth most common node for checkbox "Show only 20 most common words"
    if show == "true" and len(nodes)>20:
        temp_node_quantity = nodes_quantity.copy()
        temp_node_quantity.sort(reverse = True) 
        min_qantity = temp_node_quantity[19]
        data_index=0
        while data_index<len(nodes):
            if nodes_quantity[data_index] < min_qantity:
                del nodes[data_index]
                del nodes_quantity[data_index]
                del nodes_word_cluster[data_index]
                data_index -= 1
            data_index += 1

    for filtered_sentence in all_filtered_sentence:
        index=0

        for word in filtered_sentence:
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
           
def removeStopWords (definition):
    #replacing special signs
    definition = (" ".join(re.findall(r"[A-Za-z0-9]*", definition))).replace("  "," ")
    blob= TextBlob(definition)
    #REMOVING STOP WORDS

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

def cluster():
    word = words
    all_words = word.split(',')
    word_wants=[]
    if all_words[0] == 'true':
        word_wants.extend(["nn", "nns", "nnp", "nnps"])
    if all_words[1] == 'true':
        word_wants.extend(["vb", "vbd", "vbg", "vbn", "vbp", "vbz"])
    if all_words[2] == 'true':
        word_wants.extend(["jj", "jjr", "jjs"])
    return word_wants

#nltk.download('stopwords')
#nltk.download('punkt')
#nltk.download('averaged_perceptron_tagger')

deftext=loadDataCSV()
words = cluster()

# defie stop words
stop_words= set(stopwords.words('english'))
#start = time.time()
main(deftext)
#ende = time.time()

#print('{:5.3f}s'.format(ende-start))


